'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';

interface SupabaseContextType {
  supabase: SupabaseClient | null;
  isLoading: boolean;
  error: string | null;
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  isLoading: true,
  error: null,
});

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const client = getSupabase();
      setSupabase(client);
      setError(null);
    } catch (err: any) {
      console.error('[SupabaseProvider] Failed to initialize:', err);
      setError(err?.message || 'Failed to initialize Supabase');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase, isLoading, error }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
