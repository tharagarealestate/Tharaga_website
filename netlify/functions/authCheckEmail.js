// Netlify Function: authCheckEmail
// Checks whether an email exists in Supabase Auth (requires SERVICE ROLE)
// Returns: { exists: true|false|null, reason?: string }

export async function handler(event, context) {
	try {
		if (event.httpMethod !== 'POST') {
			return {
				statusCode: 405,
				headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
				body: JSON.stringify({ error: 'Method Not Allowed' })
			};
		}

		const SUPABASE_URL = process.env.SUPABASE_URL || '';
		const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '';

		let email = null;
		try {
			const payload = JSON.parse(event.body || '{}');
			email = (payload.email || '').toString().trim().toLowerCase();
		} catch (_) {}

		if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
			return {
				statusCode: 400,
				headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
				body: JSON.stringify({ error: 'Invalid email' })
			};
		}

		if (!SUPABASE_URL || !SERVICE_ROLE) {
			return {
				statusCode: 200,
				headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
				body: JSON.stringify({ exists: null, reason: 'missing_service_role' })
			};
		}

		const url = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
		const res = await fetch(url, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${SERVICE_ROLE}`,
				'apikey': SERVICE_ROLE,
				'Content-Type': 'application/json'
			}
		});

		if (res.status === 404) {
			return {
				statusCode: 200,
				headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
				body: JSON.stringify({ exists: false })
			};
		}

		if (!res.ok) {
			return {
				statusCode: 200,
				headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
				body: JSON.stringify({ exists: null, reason: `upstream_${res.status}` })
			};
		}

		let data = null;
		try { data = await res.json(); } catch (_) { data = null; }

		// API variants: some return array, some return object
		let exists = false;
		if (Array.isArray(data)) {
			exists = data.length > 0;
		} else if (data && typeof data === 'object') {
			// if object shape has users array
			if (Array.isArray(data.users)) exists = data.users.length > 0;
			else if (data.id) exists = true;
		}

		return {
			statusCode: 200,
			headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
			body: JSON.stringify({ exists })
		};
	} catch (err) {
		return {
			statusCode: 200,
			headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
			body: JSON.stringify({ exists: null, reason: 'exception' })
		};
	}
}

