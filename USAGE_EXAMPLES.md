# Supabase Usage Examples for Tharaga

Complete examples of using Supabase in your Tharaga project for both frontend (JavaScript) and backend (Python).

---

## Frontend (JavaScript) Usage

### Prerequisites

Make sure you have:
1. Created `js/config.js` with your credentials
2. Loaded `js/supabase-init.js` in your HTML

```html
<!-- In your HTML head or before closing body -->
<script type="module" src="/js/supabase-init.js"></script>
```

### Basic Authentication

#### Sign Up New User

```javascript
// signup.js
async function signUpUser(email, password, userData) {
  try {
    const { data, error } = await window.supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: userData.fullName,
          phone: userData.phone
        }
      }
    });

    if (error) throw error;

    console.log('User created:', data.user);
    alert('Check your email for verification link!');
    return data;

  } catch (error) {
    console.error('Signup error:', error.message);
    alert('Signup failed: ' + error.message);
  }
}

// Usage
document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const fullName = document.getElementById('fullName').value;

  await signUpUser(email, password, { fullName });
});
```

#### Login User

```javascript
// login.js
async function loginUser(email, password) {
  try {
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    console.log('Logged in:', data.user);
    // Redirect to dashboard
    window.location.href = '/app/dashboard.html';
    return data;

  } catch (error) {
    console.error('Login error:', error.message);
    alert('Login failed: ' + error.message);
  }
}
```

#### Logout User

```javascript
// logout.js
async function logoutUser() {
  try {
    const { error } = await window.supabase.auth.signOut();
    if (error) throw error;

    console.log('Logged out successfully');
    window.location.href = '/index.html';

  } catch (error) {
    console.error('Logout error:', error.message);
  }
}

// Usage
document.getElementById('logout-btn').addEventListener('click', logoutUser);
```

#### Get Current User

```javascript
// Check if user is logged in
async function getCurrentUser() {
  const { data: { user } } = await window.supabase.auth.getUser();
  return user;
}

// Usage
async function checkAuth() {
  const user = await getCurrentUser();

  if (user) {
    console.log('Logged in as:', user.email);
    document.getElementById('user-email').textContent = user.email;
  } else {
    console.log('Not logged in');
    // Redirect to login
    window.location.href = '/login.html';
  }
}

// Call on page load
checkAuth();
```

#### Listen to Auth Changes

```javascript
// auth-listener.js
// Listen for auth state changes globally
window.addEventListener('supabase-auth-change', (event) => {
  const { event: authEvent, session } = event.detail;

  console.log('Auth event:', authEvent);

  if (authEvent === 'SIGNED_IN') {
    console.log('User signed in:', session.user.email);
    // Update UI
    showUserProfile(session.user);
  } else if (authEvent === 'SIGNED_OUT') {
    console.log('User signed out');
    // Clear UI
    hideUserProfile();
  }
});
```

### Database Operations (Frontend)

#### Read Data (SELECT)

```javascript
// Get all active properties
async function getProperties() {
  try {
    const { data, error } = await window.supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    console.log('Properties:', data);
    return data;

  } catch (error) {
    console.error('Error fetching properties:', error.message);
  }
}

// Get property with specific ID
async function getPropertyById(propertyId) {
  try {
    const { data, error } = await window.supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single(); // Returns single object, not array

    if (error) throw error;
    return data;

  } catch (error) {
    console.error('Error fetching property:', error.message);
  }
}

// Get properties with JOIN (related data)
async function getPropertiesWithOwner() {
  try {
    const { data, error } = await window.supabase
      .from('properties')
      .select(`
        *,
        owner:profiles(full_name, avatar_url)
      `)
      .eq('status', 'active');

    if (error) throw error;
    return data;

  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

#### Insert Data

```javascript
// Create new property listing
async function createProperty(propertyData) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await window.supabase
      .from('properties')
      .insert({
        user_id: user.id,
        title: propertyData.title,
        description: propertyData.description,
        price: propertyData.price,
        location: propertyData.location,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    console.log('Property created:', data);
    return data;

  } catch (error) {
    console.error('Error creating property:', error.message);
    alert('Failed to create property: ' + error.message);
  }
}

// Usage
document.getElementById('property-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const propertyData = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    price: parseFloat(document.getElementById('price').value),
    location: document.getElementById('location').value
  };

  const newProperty = await createProperty(propertyData);
  if (newProperty) {
    alert('Property created successfully!');
    window.location.href = `/property/${newProperty.id}`;
  }
});
```

#### Update Data

```javascript
// Update property
async function updateProperty(propertyId, updates) {
  try {
    const { data, error } = await window.supabase
      .from('properties')
      .update(updates)
      .eq('id', propertyId)
      .select()
      .single();

    if (error) throw error;

    console.log('Property updated:', data);
    return data;

  } catch (error) {
    console.error('Error updating property:', error.message);
  }
}

// Usage: Publish a draft property
async function publishProperty(propertyId) {
  return await updateProperty(propertyId, { status: 'published' });
}
```

#### Delete Data

```javascript
// Delete property
async function deleteProperty(propertyId) {
  try {
    const confirmDelete = confirm('Are you sure you want to delete this property?');
    if (!confirmDelete) return;

    const { error } = await window.supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);

    if (error) throw error;

    console.log('Property deleted');
    alert('Property deleted successfully');
    window.location.href = '/app/my-properties.html';

  } catch (error) {
    console.error('Error deleting property:', error.message);
    alert('Failed to delete property: ' + error.message);
  }
}
```

### Real-time Subscriptions

```javascript
// Listen for changes to properties table
function subscribeToProperties() {
  const subscription = window.supabase
    .channel('properties-channel')
    .on(
      'postgres_changes',
      {
        event: '*', // 'INSERT', 'UPDATE', 'DELETE', or '*' for all
        schema: 'public',
        table: 'properties'
      },
      (payload) => {
        console.log('Change received:', payload);

        if (payload.eventType === 'INSERT') {
          console.log('New property:', payload.new);
          addPropertyToUI(payload.new);
        } else if (payload.eventType === 'UPDATE') {
          console.log('Updated property:', payload.new);
          updatePropertyInUI(payload.new);
        } else if (payload.eventType === 'DELETE') {
          console.log('Deleted property:', payload.old);
          removePropertyFromUI(payload.old.id);
        }
      }
    )
    .subscribe();

  return subscription;
}

// Start listening
const subscription = subscribeToProperties();

// Stop listening when leaving page
window.addEventListener('beforeunload', () => {
  subscription.unsubscribe();
});
```

### Storage (File Upload)

```javascript
// Upload profile picture
async function uploadAvatar(file) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload file
    const { data, error } = await window.supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = window.supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    console.log('File uploaded:', publicUrl);

    // Update user profile with avatar URL
    await window.supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('user_id', user.id);

    return publicUrl;

  } catch (error) {
    console.error('Upload error:', error.message);
  }
}

// Usage
document.getElementById('avatar-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    const url = await uploadAvatar(file);
    if (url) {
      document.getElementById('avatar-preview').src = url;
    }
  }
});
```

---

## Backend (Python) Usage

### Prerequisites

```bash
cd backend
pip install python-dotenv supabase
```

### Basic Usage

```python
# backend/app/routes/properties.py
from fastapi import APIRouter, HTTPException
from app.supabase_client import supabase, get_user_by_id

router = APIRouter()


@router.get("/properties")
async def get_properties():
    """Get all active properties"""
    try:
        response = supabase.table('properties')\
            .select('*')\
            .eq('status', 'active')\
            .order('created_at', desc=True)\
            .execute()

        return {"properties": response.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/properties/{property_id}")
async def get_property(property_id: str):
    """Get property by ID"""
    try:
        response = supabase.table('properties')\
            .select('*')\
            .eq('id', property_id)\
            .single()\
            .execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Property not found")

        return response.data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/properties")
async def create_property(property_data: dict, user_id: str):
    """Create new property"""
    try:
        # Validate user exists
        user = get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Insert property
        response = supabase.table('properties').insert({
            'user_id': user_id,
            'title': property_data['title'],
            'description': property_data.get('description'),
            'price': property_data['price'],
            'location': property_data['location'],
            'status': 'draft'
        }).execute()

        return {"property": response.data[0]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/properties/{property_id}")
async def update_property(property_id: str, updates: dict):
    """Update property"""
    try:
        response = supabase.table('properties')\
            .update(updates)\
            .eq('id', property_id)\
            .execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Property not found")

        return {"property": response.data[0]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/properties/{property_id}")
async def delete_property(property_id: str):
    """Delete property"""
    try:
        response = supabase.table('properties')\
            .delete()\
            .eq('id', property_id)\
            .execute()

        return {"message": "Property deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Advanced Python Usage

```python
# backend/app/services/property_service.py
from typing import List, Optional
from app.supabase_client import supabase


class PropertyService:
    """Service class for property-related operations"""

    @staticmethod
    def get_user_properties(user_id: str) -> List[dict]:
        """Get all properties owned by a user"""
        response = supabase.table('properties')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('created_at', desc=True)\
            .execute()

        return response.data

    @staticmethod
    def search_properties(query: str, filters: dict) -> List[dict]:
        """Search properties with filters"""
        # Start query
        db_query = supabase.table('properties').select('*')

        # Apply filters
        if filters.get('min_price'):
            db_query = db_query.gte('price', filters['min_price'])

        if filters.get('max_price'):
            db_query = db_query.lte('price', filters['max_price'])

        if filters.get('location'):
            db_query = db_query.ilike('location', f"%{filters['location']}%")

        # Text search
        if query:
            db_query = db_query.or_(
                f"title.ilike.%{query}%,description.ilike.%{query}%"
            )

        response = db_query.execute()
        return response.data

    @staticmethod
    def get_property_statistics(user_id: str) -> dict:
        """Get property statistics for a user"""
        properties = PropertyService.get_user_properties(user_id)

        total = len(properties)
        active = len([p for p in properties if p['status'] == 'active'])
        draft = len([p for p in properties if p['status'] == 'draft'])

        total_value = sum(p.get('price', 0) for p in properties)

        return {
            'total_properties': total,
            'active_properties': active,
            'draft_properties': draft,
            'total_value': total_value
        }
```

---

## Edge Function Usage (Supabase Functions)

```typescript
// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Get Supabase client (credentials injected automatically)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { user_id, message } = await req.json()

    // Store notification in database
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user_id,
        message: message,
        read: false
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, notification: data }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## Complete Example: Property Listing Page

```html
<!-- property-listing.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Property Listings - Tharaga</title>
</head>
<body>
  <div id="properties-container"></div>

  <script type="module">
    // Initialize Supabase
    import './js/supabase-init.js';

    // Wait for Supabase to be ready
    setTimeout(async () => {
      await loadProperties();
    }, 500);

    async function loadProperties() {
      try {
        // Fetch properties
        const { data, error } = await window.supabase
          .from('properties')
          .select(`
            *,
            owner:profiles(full_name, avatar_url)
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Display properties
        const container = document.getElementById('properties-container');
        container.innerHTML = data.map(property => `
          <div class="property-card">
            <h3>${property.title}</h3>
            <p>${property.description}</p>
            <p><strong>Price:</strong> ₹${property.price.toLocaleString()}</p>
            <p><strong>Location:</strong> ${property.location}</p>
            <p><strong>Owner:</strong> ${property.owner.full_name}</p>
          </div>
        `).join('');

      } catch (error) {
        console.error('Error loading properties:', error);
      }
    }
  </script>
</body>
</html>
```

---

## Testing Your Setup

### Frontend Test
```javascript
// test.js - Run in browser console
// Test 1: Check if Supabase is loaded
console.log('Supabase loaded:', !!window.supabase);

// Test 2: Check configuration
const { data } = await window.supabase.auth.getSession();
console.log('Session:', data.session);

// Test 3: Test query
const { data: testData, error } = await window.supabase
  .from('properties')
  .select('count');
console.log('Query test:', { testData, error });
```

### Backend Test
```python
# backend/test_supabase.py
from app.supabase_client import supabase

def test_connection():
    """Test Supabase connection"""
    try:
        # Try to fetch one row
        response = supabase.table('properties').select('*').limit(1).execute()
        print("✓ Connection successful")
        print(f"  Data: {response.data}")
        return True
    except Exception as e:
        print(f"✗ Connection failed: {e}")
        return False

if __name__ == '__main__':
    test_connection()
```

Run: `python backend/test_supabase.py`

---

## Next Steps

1. Read `SUPABASE_SETUP_GUIDE.md` to rotate your keys
2. Update `js/config.js` with new credentials after rotation
3. Test your authentication flow
4. Implement RLS policies (see `.cursor/rules/create-rls-policies.mdc`)
5. Deploy to production

For more examples, see:
- [Supabase JavaScript Docs](https://supabase.com/docs/reference/javascript)
- [Supabase Python Docs](https://supabase.com/docs/reference/python)
