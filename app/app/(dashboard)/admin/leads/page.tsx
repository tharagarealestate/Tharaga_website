'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type Lead = {
  id: string;
  created_at: string;
  property_id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
};

export default function AdminLeadsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Lead[]>([]);
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
        router.push('/login?next=/admin/leads');
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
      const res = await fetch('/api/admin/leads', {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Leads Management</h1>
        <p className="text-slate-300">View and manage all property leads</p>
      </div>

      {msg && (
        <div className="bg-slate-800/95 border-2 border-amber-300 rounded-lg p-4 text-sm text-slate-200">
          {msg}
        </div>
      )}

      {busy && (
        <div className="text-sm text-slate-400">Loading…</div>
      )}

      <div className="bg-slate-800/95 border-2 border-amber-300 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-3 py-3 text-left text-slate-300 font-bold">When</th>
                <th className="px-3 py-3 text-left text-slate-300 font-bold">Name</th>
                <th className="px-3 py-3 text-left text-slate-300 font-bold">Contact</th>
                <th className="px-3 py-3 text-left text-slate-300 font-bold">Property</th>
                <th className="px-3 py-3 text-left text-slate-300 font-bold">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-700/30">
                  <td className="px-3 py-3 text-slate-200 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-white">{r.name || '-'}</td>
                  <td className="px-3 py-3 text-slate-200">
                    <div>{r.email || '-'}</div>
                    <div className="text-xs text-slate-400">{r.phone || '-'}</div>
                  </td>
                  <td className="px-3 py-3 text-slate-200">{r.property_id}</td>
                  <td className="px-3 py-3 text-slate-200">{r.message || '-'}</td>
                </tr>
              ))}
              {!rows.length && !busy && (
                <tr>
                  <td className="px-3 py-8 text-center text-slate-400" colSpan={5}>
                    No leads yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}




