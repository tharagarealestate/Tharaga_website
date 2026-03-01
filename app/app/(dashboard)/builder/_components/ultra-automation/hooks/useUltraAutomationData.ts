/**
 * Custom React Hooks for Ultra Automation Data Fetching
 * Optimized with caching, error handling, and real-time updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { classifyHttpError, type ErrorType } from '@/lib/error-handler';
import { useBuilderAuth } from '../../BuilderAuthProvider';

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
  const { isAuthenticated, isLoading: authLoading, builderId } = useBuilderAuth();
  const queryKey = ['ultra-automation', 'viewings', filters, builderId];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Only make API call if authenticated
      if (!isAuthenticated || !builderId) {
        throw new Error('Authentication required');
      }
      
      // Real API call
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      params.set('builder_id', builderId);
      
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
    enabled: !authLoading && isAuthenticated && !!builderId,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: (failureCount, error: any) => {
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
  const { isAuthenticated, isLoading: authLoading, builderId } = useBuilderAuth();
  const queryKey = ['ultra-automation', 'negotiations', filters, builderId];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Only make API call if authenticated
      if (!isAuthenticated || !builderId) {
        throw new Error('Authentication required');
      }
      
      // Real API call
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      params.set('builder_id', builderId);
      
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
    enabled: !authLoading && isAuthenticated && !!builderId,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: (failureCount, error: any) => {
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
  const { isAuthenticated, isLoading: authLoading, builderId } = useBuilderAuth();
  const queryKey = ['ultra-automation', 'contracts', filters, builderId];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Only make API call if authenticated
      if (!isAuthenticated || !builderId) {
        throw new Error('Authentication required');
      }
      
      // Real API call
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      params.set('builder_id', builderId);
      
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
    enabled: !authLoading && isAuthenticated && !!builderId,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: (failureCount, error: any) => {
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
  const { isAuthenticated, isLoading: authLoading, builderId } = useBuilderAuth();
  const queryKey = ['ultra-automation', 'deal-lifecycle', filters, builderId];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Only make API call if authenticated
      if (!isAuthenticated || !builderId) {
        throw new Error('Authentication required');
      }
      
      // Real API call
      const params = new URLSearchParams();
      if (filters?.stage) params.set('stage', filters.stage);
      params.set('builder_id', builderId);
      
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
    enabled: !authLoading && isAuthenticated && !!builderId,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: (failureCount, error: any) => {
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

