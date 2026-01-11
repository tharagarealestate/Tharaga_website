/**
 * Custom React Hooks for Ultra Automation Data Fetching
 * Optimized with caching, error handling, and real-time updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { classifyHttpError, type ErrorType } from '@/lib/error-handler';
import { useDemoMode, DEMO_DATA } from '../../DemoDataProvider';

const API_BASE = '/api/ultra-automation';

export interface ApiError {
  type: ErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
  technicalDetails?: string;
}

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
  // Safe access to demo mode - hook always returns safe defaults
  const { isDemoMode } = useDemoMode();
  const queryKey = ['ultra-automation', 'viewings', filters, isDemoMode];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Return demo data if in demo mode
      if (isDemoMode) {
        let viewings = DEMO_DATA.viewings.viewings;
        const reminders = DEMO_DATA.viewings.reminders;
        
        // Apply status filter if provided
        if (filters?.status && filters.status !== 'all') {
          viewings = viewings.filter((v: any) => v.status === filters.status);
        }
        
        return { viewings, reminders, isEmpty: false };
      }
      
      // Real API call
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.builder_id) params.set('builder_id', filters.builder_id);
      
      const url = `${API_BASE}/viewings${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        const errorInfo = data.errorType 
          ? { type: data.errorType, message: data.message || data.error, retryable: data.retryable !== false }
          : classifyHttpError(res.status, data);
        
        const error: ApiError = {
          type: errorInfo.type,
          message: errorInfo.message,
          userMessage: data.message || errorInfo.userMessage,
          retryable: errorInfo.retryable,
          technicalDetails: data.technicalDetails,
        };
        
        throw error;
      }
      
      if (data.isEmpty || !data.data?.viewings?.length) {
        return { viewings: [], reminders: [], isEmpty: true };
      }
      
      return data.data || { viewings: [], reminders: [] };
    },
    refetchInterval: isDemoMode ? false : 60000,
    staleTime: isDemoMode ? Infinity : 30000,
    retry: (failureCount, error: any) => {
      if (isDemoMode) return false;
      if (error?.retryable === false) return false;
      return failureCount < 2;
    },
    retryDelay: 1000,
  });
}

/**
 * Fetch negotiations
 */
export function useNegotiations(filters?: { status?: string; builder_id?: string }) {
  // Safe access to demo mode - hook always returns safe defaults
  const { isDemoMode } = useDemoMode();
  const queryKey = ['ultra-automation', 'negotiations', filters, isDemoMode];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Return demo data if in demo mode
      if (isDemoMode) {
        let negotiations = DEMO_DATA.negotiations.negotiations;
        const insights = DEMO_DATA.negotiations.insights;
        
        // Apply status filter if provided
        if (filters?.status && filters.status !== 'all') {
          negotiations = negotiations.filter((n: any) => n.status === filters.status);
        }
        
        return { negotiations, insights, isEmpty: false };
      }
      
      // Real API call
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.builder_id) params.set('builder_id', filters.builder_id);
      
      const url = `${API_BASE}/negotiations${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        const errorInfo = data.errorType 
          ? { type: data.errorType, message: data.message || data.error, retryable: data.retryable !== false }
          : classifyHttpError(res.status, data);
        
        const error: ApiError = {
          type: errorInfo.type,
          message: errorInfo.message,
          userMessage: data.message || errorInfo.userMessage,
          retryable: errorInfo.retryable,
          technicalDetails: data.technicalDetails,
        };
        
        throw error;
      }
      
      if (data.isEmpty || !data.data?.negotiations?.length) {
        return { negotiations: [], insights: [], isEmpty: true };
      }
      
      return data.data || { negotiations: [], insights: [] };
    },
    refetchInterval: isDemoMode ? false : 60000,
    staleTime: isDemoMode ? Infinity : 30000,
    retry: (failureCount, error: any) => {
      if (isDemoMode) return false;
      if (error?.retryable === false) return false;
      return failureCount < 2;
    },
    retryDelay: 1000,
  });
}

/**
 * Fetch contracts
 */
export function useContracts(filters?: { status?: string; builder_id?: string }) {
  // Safe access to demo mode - hook always returns safe defaults
  const { isDemoMode } = useDemoMode();
  const queryKey = ['ultra-automation', 'contracts', filters, isDemoMode];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Return demo data if in demo mode
      if (isDemoMode) {
        let contracts = DEMO_DATA.contracts;
        
        // Apply status filter if provided
        if (filters?.status && filters.status !== 'all') {
          contracts = contracts.filter((c: any) => c.status === filters.status);
        }
        
        return contracts;
      }
      
      // Real API call
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.builder_id) params.set('builder_id', filters.builder_id);
      
      const url = `${API_BASE}/contracts${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        const errorInfo = data.errorType 
          ? { type: data.errorType, message: data.message || data.error, retryable: data.retryable !== false }
          : classifyHttpError(res.status, data);
        
        const error: ApiError = {
          type: errorInfo.type,
          message: errorInfo.message,
          userMessage: data.message || errorInfo.userMessage,
          retryable: errorInfo.retryable,
          technicalDetails: data.technicalDetails,
        };
        
        throw error;
      }
      
      if (data.isEmpty || !Array.isArray(data.data) || data.data.length === 0) {
        return { isEmpty: true, data: [] };
      }
      
      return data.data || [];
    },
    refetchInterval: isDemoMode ? false : 60000,
    staleTime: isDemoMode ? Infinity : 30000,
    retry: (failureCount, error: any) => {
      if (isDemoMode) return false;
      if (error?.retryable === false) return false;
      return failureCount < 2;
    },
    retryDelay: 1000,
  });
}

/**
 * Fetch deal lifecycles
 */
export function useDealLifecycles(filters?: { stage?: string; builder_id?: string }) {
  // Safe access to demo mode - hook always returns safe defaults
  const { isDemoMode } = useDemoMode();
  const queryKey = ['ultra-automation', 'deal-lifecycle', filters, isDemoMode];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Return demo data if in demo mode
      if (isDemoMode) {
        let lifecycles = DEMO_DATA.dealLifecycles.lifecycles;
        let milestones = DEMO_DATA.dealLifecycles.milestones;
        
        // Apply stage filter if provided
        if (filters?.stage && filters.stage !== 'all') {
          lifecycles = lifecycles.filter((l: any) => l.current_stage === filters.stage);
        }
        
        return { lifecycles, milestones, isEmpty: false };
      }
      
      // Real API call
      const params = new URLSearchParams();
      if (filters?.stage) params.set('stage', filters.stage);
      if (filters?.builder_id) params.set('builder_id', filters.builder_id);
      
      const url = `${API_BASE}/deal-lifecycle${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        // Classify error from API response
        const errorInfo = data.errorType 
          ? { type: data.errorType, message: data.message || data.error, retryable: data.retryable !== false }
          : classifyHttpError(res.status, data);
        
        const error: ApiError = {
          type: errorInfo.type,
          message: errorInfo.message,
          userMessage: data.message || errorInfo.userMessage,
          retryable: errorInfo.retryable,
          technicalDetails: data.technicalDetails,
        };
        
        throw error;
      }
      
      // Check if empty data (not an error)
      if (data.isEmpty || !data.data?.lifecycles?.length) {
        return { lifecycles: [], milestones: [], isEmpty: true };
      }
      
      return data.data || { lifecycles: [], milestones: [] };
    },
    refetchInterval: isDemoMode ? false : 60000,
    staleTime: isDemoMode ? Infinity : 30000,
    retry: (failureCount, error: any) => {
      if (isDemoMode) return false;
      // Only retry if error is retryable
      if (error?.retryable === false) return false;
      return failureCount < 2;
    },
    retryDelay: 1000,
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

