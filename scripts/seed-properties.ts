import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for seeding
);

const sampleProperties = [
  {
    title: "Luxury 3BHK Apartment in Velachery with Premium Amenities",
    description: "Spacious 3BHK apartment featuring modern interiors, ample natural light, and high-quality fittings. Located in the heart of Velachery with easy access to schools, hospitals, and IT corridors. Perfect for families looking for comfort and convenience.",
    property_type: "apartment",
    bhk_type: "3BHK",
    city: "Chennai",
    state: "Tamil Nadu",
    address: "123 Main Road, Velachery",
    pincode: "600042",
    base_price: 8500000,
    price_per_sqft: 5862,
    carpet_area: 1450,
    built_up_area: 1650,
    amenities: ["Parking", "Lift", "24x7 Security", "Gym", "Swimming Pool", "Power Backup", "Children Play Area"],
    possession_status: "ready-to-move",
    furnishing_status: "semi-furnished",
    facing: "East",
    floor_number: 5,
    total_floors: 10,
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      "https://images.unsplash.com/photo-1560185127-6ed2a0bc1e11?w=800",
      "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800"
    ],
    verification_status: "approved",
    rera_number: "TN/04/2023/001234",
    rera_verified: true,
    approved_by_bank: true,
    clear_title: true,
    ai_appreciation_band: "high",
    ai_rental_yield: 4.2,
    ai_risk_score: 25,
    slug: "luxury-3bhk-velachery-chennai",
    availability_status: "available",
    negotiable: true,
    view_count: 0,
    inquiry_count: 0,
    favorite_count: 0
  },
  {
    title: "Premium 2BHK Apartment in Adyar - Ready to Move",
    description: "Beautiful 2BHK apartment in prime Adyar location. Close to beaches, shopping centers, and excellent schools. Well-maintained building with modern amenities.",
    property_type: "apartment",
    bhk_type: "2BHK",
    city: "Chennai",
    state: "Tamil Nadu",
    address: "45 Beach Road, Adyar",
    pincode: "600020",
    base_price: 6500000,
    price_per_sqft: 5420,
    carpet_area: 1200,
    built_up_area: 1380,
    amenities: ["Parking", "Lift", "24x7 Security", "Gym", "Power Backup"],
    possession_status: "ready-to-move",
    furnishing_status: "fully-furnished",
    facing: "South",
    floor_number: 3,
    total_floors: 8,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800"
    ],
    verification_status: "approved",
    rera_verified: true,
    approved_by_bank: true,
    clear_title: true,
    ai_appreciation_band: "medium",
    ai_rental_yield: 3.8,
    ai_risk_score: 30,
    slug: "premium-2bhk-adyar-chennai",
    availability_status: "available",
    negotiable: true,
    view_count: 0,
    inquiry_count: 0,
    favorite_count: 0
  },
  {
    title: "Spacious 4BHK Villa in OMR with Private Garden",
    description: "Exclusive 4BHK independent villa in OMR corridor. Features private garden, modern architecture, and premium finishes. Ideal for luxury living.",
    property_type: "villa",
    bhk_type: "4BHK",
    city: "Chennai",
    state: "Tamil Nadu",
    address: "78 IT Corridor, OMR",
    pincode: "600096",
    base_price: 18000000,
    price_per_sqft: 4500,
    carpet_area: 4000,
    plot_area: 3000,
    amenities: ["Parking", "24x7 Security", "Garden", "Swimming Pool", "Power Backup", "Gym", "Clubhouse"],
    possession_status: "ready-to-move",
    furnishing_status: "semi-furnished",
    facing: "North",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"
    ],
    verification_status: "approved",
    rera_verified: true,
    approved_by_bank: true,
    clear_title: true,
    ai_appreciation_band: "high",
    ai_rental_yield: 4.5,
    ai_risk_score: 20,
    slug: "spacious-4bhk-villa-omr-chennai",
    availability_status: "available",
    negotiable: true,
    view_count: 0,
    inquiry_count: 0,
    favorite_count: 0
  }
];

async function seedProperties() {
  console.log('Starting property seed...');
  
  // First, try to get a builder profile to use as builder_id
  const { data: builders } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'builder')
    .limit(1);
  
  const builderId = builders && builders.length > 0 ? builders[0].id : null;
  
  if (!builderId) {
    console.error('No builder profile found. Please create a builder profile first.');
    return;
  }
  
  for (const property of sampleProperties) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert({
          ...property,
          builder_id: builderId,
          published_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error('Error inserting property:', error);
      } else {
        console.log('✓ Inserted property:', data[0].title);
      }
    } catch (err) {
      console.error('Exception inserting property:', err);
    }
  }
  
  console.log('Property seed completed!');
}

seedProperties().catch(console.error);

