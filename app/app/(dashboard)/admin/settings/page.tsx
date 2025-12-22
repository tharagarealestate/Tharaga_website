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
        <h1 className="text-3xl font-bold text-white mb-2">Builder Settings</h1>
        <p className="text-slate-300">Manage builder information and contact details</p>
      </div>

      {msg && (
        <div className="bg-slate-800/95 border-2 border-amber-300 rounded-lg p-4 text-sm text-slate-200">
          {msg}
        </div>
      )}

      {busy && (
        <div className="text-sm text-slate-400">Working…</div>
      )}

      <div className="space-y-3">
        {rows.map((r, idx) => (
          <div
            key={r.id}
            className="bg-slate-800/95 border-2 border-amber-300 rounded-lg p-4 grid grid-cols-5 gap-3 items-center hover:bg-slate-700/50 transition-colors"
          >
            <input
              className="col-span-1 px-3 py-2 bg-slate-700/50 border-2 border-amber-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
              value={r.name || ''}
              onChange={(e) => setRows(s => s.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
              placeholder="Name"
            />
            <input
              className="col-span-2 px-3 py-2 bg-slate-700/50 border-2 border-amber-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
              placeholder="email"
              value={r.email || ''}
              onChange={(e) => setRows(s => s.map((x, i) => i === idx ? { ...x, email: e.target.value } : x))}
            />
            <input
              className="col-span-1 px-3 py-2 bg-slate-700/50 border-2 border-amber-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
              placeholder="phone"
              value={r.phone || ''}
              onChange={(e) => setRows(s => s.map((x, i) => i === idx ? { ...x, phone: e.target.value } : x))}
            />
            <div className="col-span-1 flex gap-2 justify-end">
              <button
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-colors border-2 border-amber-300"
                onClick={() => save(rows[idx])}
              >
                Save
              </button>
            </div>
          </div>
        ))}
        {!rows.length && !busy && (
          <div className="text-sm text-slate-400 text-center py-8">
            No builders yet.
          </div>
        )}
      </div>
    </div>
  );
}

