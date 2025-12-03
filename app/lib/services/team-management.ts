import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

export type TeamRole = 'owner' | 'admin' | 'manager' | 'sales' | 'member';
export type Permission =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'assign'
  | 'export'
  | 'publish'
  | 'invite'
  | 'remove'
  | 'manage';
export type Resource =
  | 'leads'
  | 'properties'
  | 'analytics'
  | 'team'
  | 'settings'
  | 'billing';

interface TeamMember {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: TeamRole;
  permissions: Record<Resource, Permission[]>;
  status: string;
  lastActiveAt?: string;
  designation?: string;
}

export class TeamManagementService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Invite a new team member
   */
  async inviteTeamMember(
    builderId: string,
    inviterId: string,
    email: string,
    role: TeamRole,
    customPermissions?: Record<Resource, Permission[]>
  ): Promise<{ success: boolean; memberId?: string; error?: string }> {
    const { data: existing } = await this.supabase
      .from('team_members')
      .select('id, status')
      .eq('builder_id', builderId)
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existing && existing.status === 'active') {
      return { success: false, error: 'User is already a team member' };
    }

    const { data: rolePermissions } = await this.supabase
      .from('team_role_permissions')
      .select('permissions')
      .eq('role', role)
      .maybeSingle();

    const permissions = customPermissions || rolePermissions?.permissions || {};

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { data: member, error } = await this.supabase
      .from('team_members')
      .upsert({
        builder_id: builderId,
        email: email.toLowerCase(),
        role,
        permissions,
        invite_token: inviteToken,
        invite_sent_at: new Date().toISOString(),
        invite_expires_at: inviteExpiresAt.toISOString(),
        status: 'pending',
      })
      .select('id')
      .single();

    if (error || !member) {
      return { success: false, error: 'Failed to create invitation' };
    }

    // Integrate real email sending via existing email service if desired
    // For now, log the invite URL for debugging
    // eslint-disable-next-line no-console
    console.log(
      '[Team] Invite link:',
      `${process.env.NEXT_PUBLIC_APP_URL}/team/accept?token=${inviteToken}`
    );

    await this.logActivity(builderId, inviterId, 'team_invite_sent', {
      invitedEmail: email,
      role,
    });

    return { success: true, memberId: member.id };
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(
    inviteToken: string,
    userId: string
  ): Promise<{ success: boolean; builderId?: string; error?: string }> {
    const { data: member, error } = await this.supabase
      .from('team_members')
      .select('*')
      .eq('invite_token', inviteToken)
      .eq('status', 'pending')
      .maybeSingle();

    if (error || !member) {
      return { success: false, error: 'Invalid or expired invitation' };
    }

    if (member.invite_expires_at && new Date(member.invite_expires_at) < new Date()) {
      return { success: false, error: 'Invitation has expired' };
    }

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('full_name, avatar_url, phone')
      .eq('id', userId)
      .maybeSingle();

    await this.supabase
      .from('team_members')
      .update({
        user_id: userId,
        status: 'active',
        invite_accepted_at: new Date().toISOString(),
        invite_token: null,
        display_name: profile?.full_name,
        avatar_url: profile?.avatar_url,
        phone: profile?.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', member.id);

    await this.logActivity(member.builder_id, userId, 'team_invite_accepted', {
      memberEmail: member.email,
    });

    return { success: true, builderId: member.builder_id };
  }

  /**
   * Get all team members for a builder
   */
  async getTeamMembers(builderId: string): Promise<TeamMember[]> {
    const { data, error } = await this.supabase
      .from('team_members')
      .select('*')
      .eq('builder_id', builderId)
      .neq('status', 'removed')
      .order('created_at');

    if (error) throw error;

    return (data || []).map((m: any) => ({
      id: m.id,
      email: m.email,
      displayName: m.display_name,
      avatarUrl: m.avatar_url,
      role: m.role,
      permissions: m.permissions,
      status: m.status,
      lastActiveAt: m.last_active_at,
      designation: m.designation,
    }));
  }

  /**
   * Check permission for a user on a given builder
   */
  async hasPermission(
    userId: string,
    builderId: string,
    resource: Resource,
    permission: Permission
  ): Promise<boolean> {
    const { data } = await this.supabase
      .from('team_members')
      .select('permissions, status')
      .eq('builder_id', builderId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!data) return false;

    const resourcePermissions = (data.permissions?.[resource] ||
      []) as Permission[];
    return resourcePermissions.includes(permission);
  }

  /**
   * Assign lead to team member
   */
  async assignLead(
    leadId: number,
    assignedToId: string,
    assignedById: string,
    notes?: string
  ): Promise<void> {
    // Mark existing assignments as reassigned
    await this.supabase
      .from('lead_assignments')
      .update({ status: 'reassigned' })
      .eq('lead_id', leadId)
      .eq('status', 'active');

    // Create new assignment
    await this.supabase.from('lead_assignments').insert({
      lead_id: leadId,
      assigned_to: assignedToId,
      assigned_by: assignedById,
      assignment_notes: notes,
    });

    // Update lead table
    await this.supabase
      .from('leads')
      .update({ assigned_to: assignedToId })
      .eq('id', leadId);
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(userId: string, builderId: string): Promise<void> {
    await this.supabase
      .from('team_members')
      .update({ last_active_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('builder_id', builderId);
  }

  private async logActivity(
    builderId: string,
    userId: string,
    activityType: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.supabase.from('team_activity_log').insert({
      builder_id: builderId,
      user_id: userId,
      activity_type: activityType,
      metadata,
    });
  }
}

export const teamManagementService = new TeamManagementService();




