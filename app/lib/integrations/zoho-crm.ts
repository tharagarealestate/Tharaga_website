import { createClient } from '@supabase/supabase-js';

interface ZohoConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  apiDomain: string;
}

interface ZohoLead {
  First_Name: string;
  Last_Name: string;
  Email: string;
  Phone: string;
  Lead_Source: string;
  Description: string;
  Property_Interest?: string;
  Budget?: number;
  City?: string;
}

export class ZohoCRMIntegration {
  private supabase: ReturnType<typeof createClient>;
  private config: ZohoConfig;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.config = {
      clientId: process.env.ZOHO_CLIENT_ID!,
      clientSecret: process.env.ZOHO_CLIENT_SECRET!,
      redirectUri: process.env.ZOHO_REDIRECT_URI!,
      apiDomain: 'https://www.zohoapis.in', // India datacenter
    };
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(builderId: string): string {
    const state = Buffer.from(JSON.stringify({ builderId })).toString('base64');

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      access_type: 'offline',
      scope: 'ZohoCRM.modules.ALL,ZohoCRM.settings.ALL',
      state,
    });
    return `https://accounts.zoho.in/oauth/v2/auth?${params}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async handleCallback(
    code: string,
    builderId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://accounts.zoho.in/oauth/v2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          code,
        }),
      });

      const data = await response.json();
      if (data.error) {
        return { success: false, error: data.error };
      }

      // Store tokens (encrypted - would use piiEncryption in production)
      const expiresAt = new Date(Date.now() + data.expires_in * 1000);
      await this.supabase
        .from('integrations')
        .upsert({
          builder_id: builderId,
          provider: 'zoho_crm',
          status: 'connected',
          access_token: data.access_token, // In production, encrypt this
          refresh_token: data.refresh_token ? data.refresh_token : null,
          token_expires_at: expiresAt.toISOString(),
          config: {
            api_domain: data.api_domain || this.config.apiDomain,
          },
          updated_at: new Date().toISOString(),
        });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Refresh access token
   */
  private async refreshToken(builderId: string): Promise<string | null> {
    const { data: integration } = await this.supabase
      .from('integrations')
      .select('*')
      .eq('builder_id', builderId)
      .eq('provider', 'zoho_crm')
      .single();

    if (!integration || !integration.refresh_token) {
      return null;
    }

    const refreshToken = integration.refresh_token; // In production, decrypt this

    const response = await fetch('https://accounts.zoho.in/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();
    if (data.error) {
      await this.supabase
        .from('integrations')
        .update({ status: 'error', sync_error: data.error })
        .eq('id', integration.id);
      return null;
    }

    // Update stored token
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);
    await this.supabase
      .from('integrations')
      .update({
        access_token: data.access_token, // In production, encrypt this
        token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    return data.access_token;
  }

  /**
   * Get valid access token
   */
  private async getAccessToken(builderId: string): Promise<string | null> {
    const { data: integration } = await this.supabase
      .from('integrations')
      .select('*')
      .eq('builder_id', builderId)
      .eq('provider', 'zoho_crm')
      .eq('status', 'connected')
      .single();

    if (!integration) return null;

    // Check if token is expired
    const expiresAt = new Date(integration.token_expires_at);
    if (expiresAt <= new Date()) {
      return this.refreshToken(builderId);
    }

    return integration.access_token; // In production, decrypt this
  }

  /**
   * Sync lead to Zoho CRM
   */
  async syncLead(
    builderId: string,
    lead: {
      name: string;
      email: string;
      phone: string;
      property_title?: string;
      budget_min?: number;
      city?: string;
      message?: string;
    }
  ): Promise<{ success: boolean; zohoId?: string; error?: string }> {
    const accessToken = await this.getAccessToken(builderId);
    if (!accessToken) {
      return { success: false, error: 'Not connected to Zoho CRM' };
    }

    // Get field mapping
    const { data: integration } = await this.supabase
      .from('integrations')
      .select('config, field_mapping')
      .eq('builder_id', builderId)
      .eq('provider', 'zoho_crm')
      .single();

    const apiDomain = integration?.config?.api_domain || this.config.apiDomain;

    // Parse name into first/last
    const nameParts = lead.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    const zohoLead: ZohoLead = {
      First_Name: firstName,
      Last_Name: lastName,
      Email: lead.email,
      Phone: lead.phone,
      Lead_Source: 'Tharaga Platform',
      Description: lead.message || '',
      Property_Interest: lead.property_title,
      Budget: lead.budget_min,
      City: lead.city,
    };

    try {
      const response = await fetch(`${apiDomain}/crm/v5/Leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [zohoLead],
          trigger: ['workflow'],
        }),
      });

      const data = await response.json();
      if (data.data?.[0]?.code === 'SUCCESS') {
        return {
          success: true,
          zohoId: data.data[0].details.id,
        };
      }

      return {
        success: false,
        error: data.data?.[0]?.message || 'Failed to create lead',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Disconnect integration
   */
  async disconnect(builderId: string): Promise<void> {
    await this.supabase
      .from('integrations')
      .update({
        status: 'disconnected',
        access_token: null,
        refresh_token: null,
        token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('builder_id', builderId)
      .eq('provider', 'zoho_crm');
  }
}

// Export singleton
export const zohoCRM = new ZohoCRMIntegration();



