/**
 * Custom React Hooks for Ultra Automation Data Fetching
 * Optimized with caching, error handling, and real-time updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

const API_BASE = '/api/ultra-automation';

interface UseBuyerJourneyOptions {
  journeyId?: string;
  leadId?: string;
  enabled?: boolean;
}

/**
 * Fetch buyer journey data for a lead or journey
 */
export function useBuyerJourney({ journeyId, leadId, enabled = true }: UseBuyerJourneyOptions) {
  const queryKey = journeyId
    ? ['ultra-automation', 'buyer-journey', journeyId]
    : ['ultra-automation', 'lead-journey', leadId];

  const url = journeyId
    ? `${API_BASE}/buyer-journey/${journeyId}`
    : leadId
    ? `${API_BASE}/leads/${leadId}/journey`
    : null;

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!url) throw new Error('journeyId or leadId required');
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch buyer journey');
      
      const data = await res.json();
      return data.data;
    },
    enabled: enabled && !!url,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 10000, // Consider data fresh for 10 seconds
  });
}

/**
 * Fetch property viewings
 */
export function useViewings(filters?: { status?: string; builder_id?: string }) {
  const queryKey = ['ultra-automation', 'viewings', filters];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.builder_id) params.set('builder_id', filters.builder_id);
      
      const url = `${API_BASE}/viewings${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch viewings');
      
      const data = await res.json();
      return data.data;
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
  });
}

/**
 * Fetch negotiations
 */
export function useNegotiations(filters?: { status?: string; builder_id?: string }) {
  const queryKey = ['ultra-automation', 'negotiations', filters];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.builder_id) params.set('builder_id', filters.builder_id);
      
      const url = `${API_BASE}/negotiations${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch negotiations');
      
      const data = await res.json();
      return data.data;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

/**
 * Fetch contracts
 */
export function useContracts(filters?: { status?: string; builder_id?: string }) {
  const queryKey = ['ultra-automation', 'contracts', filters];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.builder_id) params.set('builder_id', filters.builder_id);
      
      const url = `${API_BASE}/contracts${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch contracts');
      
      const data = await res.json();
      return data.data;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

/**
 * Fetch deal lifecycles
 */
export function useDealLifecycles(filters?: { stage?: string; builder_id?: string }) {
  const queryKey = ['ultra-automation', 'deal-lifecycle', filters];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.stage) params.set('stage', filters.stage);
      if (filters?.builder_id) params.set('builder_id', filters.builder_id);
      
      const url = `${API_BASE}/deal-lifecycle${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch deal lifecycles');
      
      const data = await res.json();
      return data.data;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

/**
 * Invalidate and refetch all Ultra Automation queries
 */
export function useRefreshUltraAutomation() {
  const queryClient = useQueryClient();
  
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ultra-automation'] });
  }, [queryClient]);
}

