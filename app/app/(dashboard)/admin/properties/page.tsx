'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type Property = { 
  id: string; 
  title: string; 
  city: string; 
  locality: string; 
  listed_at: string;
};

export default function AdminPropertiesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Property[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login?next=/admin/properties');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        router.push('/unauthorized');
        return;
      }

      load();
      loadMetrics();
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    }
  };

  async function load() {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/properties?unverified=1', { 
        headers: { 'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_TOKEN || '' } 
      });
      const j = await res.json();
      setRows(j.items || []);
    } catch (e: any) {
      setMsg(e?.message || 'Load failed');
    } finally {
      setBusy(false);
    }
  }

  async function loadMetrics() {
    try {
      const res = await fetch('/api/admin/metrics', { 
        headers: { 'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_TOKEN || '' } 
      });
      const j = await res.json();
      if (j?.ok) {
        setMsg(`7d: new ${j.newProps}, verified ${j.verifiedLast7}, leads ${j.leads}`);
      }
    } catch {}
  }

  async function verify(id: string) {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_TOKEN || ''
        },
        body: JSON.stringify({ id, verified: true, listing_status: 'active' })
      });
      const j = await res.json();
      if (j?.ok) {
        setMsg('Verified ✔');
        load();
      } else {
        setMsg(j?.error || 'Failed');
      }
    } catch (e: any) {
      setMsg(e?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Property Verification</h1>
        <p className="text-gray-400">Verify and approve property listings</p>
      </div>

      {msg && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300">
          {msg}
        </div>
      )}

      {busy && (
        <div className="text-sm text-gray-400">Loading…</div>
      )}

      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
          >
            <div>
              <div className="font-semibold text-gray-100">{r.title}</div>
              <div className="text-xs text-gray-400 mt-1">
                {[r.locality, r.city].filter(Boolean).join(', ')}
              </div>
            </div>
            <button
              onClick={() => verify(r.id)}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded-lg transition-colors"
            >
              Verify
            </button>
          </div>
        ))}
        {!rows.length && !busy && (
          <div className="text-sm text-gray-400 text-center py-8">
            No pending properties.
          </div>
        )}
      </div>
    </div>
  );
}

