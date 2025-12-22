'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type Builder = { 
  id: string; 
  name: string; 
  email: string; 
  phone: string; 
  whatsapp: string;
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Builder[]>([]);
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
        router.push('/login?next=/admin/settings');
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
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    }
  };

  async function load() {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/builders', {
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

  async function save(b: Builder) {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/builder-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_TOKEN || ''
        },
        body: JSON.stringify(b)
      });
      const j = await res.json();
      setMsg(j?.ok ? 'Saved ✔' : (j?.error || 'Failed'));
    } catch (e: any) {
      setMsg(e?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Builder Settings</h1>
        <p className="text-gray-400">Manage builder information and contact details</p>
      </div>

      {msg && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300">
          {msg}
        </div>
      )}

      {busy && (
        <div className="text-sm text-gray-400">Working…</div>
      )}

      <div className="space-y-3">
        {rows.map((r, idx) => (
          <div
            key={r.id}
            className="bg-gray-900 border border-gray-800 rounded-lg p-4 grid grid-cols-5 gap-3 items-center hover:bg-gray-800/50 transition-colors"
          >
            <input
              className="col-span-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              value={r.name || ''}
              onChange={(e) => setRows(s => s.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
              placeholder="Name"
            />
            <input
              className="col-span-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              placeholder="email"
              value={r.email || ''}
              onChange={(e) => setRows(s => s.map((x, i) => i === idx ? { ...x, email: e.target.value } : x))}
            />
            <input
              className="col-span-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              placeholder="phone"
              value={r.phone || ''}
              onChange={(e) => setRows(s => s.map((x, i) => i === idx ? { ...x, phone: e.target.value } : x))}
            />
            <div className="col-span-1 flex gap-2 justify-end">
              <button
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded-lg transition-colors"
                onClick={() => save(rows[idx])}
              >
                Save
              </button>
            </div>
          </div>
        ))}
        {!rows.length && !busy && (
          <div className="text-sm text-gray-400 text-center py-8">
            No builders yet.
          </div>
        )}
      </div>
    </div>
  );
}

