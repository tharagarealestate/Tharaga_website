'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export type UserRole = 'buyer' | 'builder' | 'admin';

interface RoleManagerState {
  roles: UserRole[];
  activeRole: UserRole;
  permissions: Array<{
    permission: string;
    resource: string;
    allowed: boolean;
  }>;
  isLoading: boolean;
  error: string | null;
  verificationStatus: {
    builder: 'pending' | 'verified' | 'rejected' | 'not_applicable';
    buyer: 'active' | 'inactive';
  };
}

interface UseRoleManagerReturn extends RoleManagerState {
  fetchRoles: () => Promise<void>;
  addRole: (role: UserRole, metadata?: Record<string, any>) => Promise<boolean>;
  switchRole: (role: UserRole) => Promise<boolean>;
  hasPermission: (permission: string, resource: string) => boolean;
  canAccessRole: (role: UserRole) => boolean;
}

export function useRoleManager(): UseRoleManagerReturn {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [state, setState] = useState<RoleManagerState>({
    roles: [],
    activeRole: 'buyer',
    permissions: [],
    isLoading: true,
    error: null,
    verificationStatus: {
      builder: 'not_applicable',
      buyer: 'active',
    },
  });

  // Fetch roles from API
  const fetchRoles = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/user/roles', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      
      const { success, data, error } = await response.json();
      
      if (!success || !data) {
        throw new Error(error || 'Unknown error');
      }
      
      setState(prev => ({
        ...prev,
        roles: data.roles,
        activeRole: data.activeRole,
        permissions: data.permissions,
        verificationStatus: data.metadata.verificationStatus,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Fetch roles error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch roles',
      }));
    }
  }, []);

  // Add new role
  const addRole = useCallback(async (
    role: UserRole,
    metadata?: Record<string, any>
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/user/add-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role, metadata }),
      });
      
      const { success, data, error } = await response.json();
      
      if (!success) {
        throw new Error(error || 'Failed to add role');
      }
      
      setState(prev => ({
        ...prev,
        roles: data.roles,
        activeRole: data.activeRole,
        isLoading: false,
        verificationStatus: {
          ...prev.verificationStatus,
          builder: data.requiresVerification ? 'pending' : prev.verificationStatus.builder,
        },
      }));
      
      // Redirect to appropriate dashboard
      const redirectMap: Record<UserRole, string> = {
        buyer: '/buyer/dashboard',
        builder: '/builder/dashboard',
        admin: '/admin/dashboard',
      };
      
      router.push(redirectMap[role]);
      
      return true;
    } catch (error) {
      console.error('Add role error:', error);
      const message = error instanceof Error ? error.message : 'Failed to add role';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      return false;
    }
  }, [router]);

  // Switch active role
  const switchRole = useCallback(async (role: UserRole): Promise<boolean> => {
    if (!state.roles.includes(role)) {
      return false;
    }
    
    if (role === state.activeRole) {
      return true; // Already active
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/user/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });
      
      const { success, data, error } = await response.json();
      
      if (!success) {
        throw new Error(error || 'Failed to switch role');
      }
      
      setState(prev => ({
        ...prev,
        activeRole: data.activeRole,
        permissions: data.permissions,
        isLoading: false,
      }));
      
      router.push(data.redirectTo);
      
      return true;
    } catch (error) {
      console.error('Switch role error:', error);
      const message = error instanceof Error ? error.message : 'Failed to switch role';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      return false;
    }
  }, [state.roles, state.activeRole, router]);

  // Check specific permission
  const hasPermission = useCallback((permission: string, resource: string): boolean => {
    return state.permissions.some(p => 
      p.allowed && 
      (p.permission === permission || p.permission === '*') &&
      (p.resource === resource || p.resource === '*')
    );
  }, [state.permissions]);

  // Check if user can access a role
  const canAccessRole = useCallback((role: UserRole): boolean => {
    if (!state.roles.includes(role)) return false;
    
    if (role === 'builder') {
      return state.verificationStatus.builder !== 'rejected';
    }
    
    return true;
  }, [state.roles, state.verificationStatus]);

  // Initial fetch
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    ...state,
    fetchRoles,
    addRole,
    switchRole,
    hasPermission,
    canAccessRole,
  };
}











