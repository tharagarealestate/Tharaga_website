// =============================================
// ZOHO CRM CLIENT - PRODUCTION READY
// OAuth, contacts, deals, properties, site visits
// Indian real estate optimized
// =============================================
import axios, { AxiosInstance, AxiosError } from 'axios';
import qs from 'qs';
import { createClient } from '@/lib/supabase/server';

// =============================================
// TYPES
// =============================================
export interface ZohoContact {
  id?: string;
  Email: string;
  First_Name?: string;
  Last_Name?: string;
  Full_Name?: string;
  Phone?: string;
  Mobile?: string;
  Secondary_Email?: string;
  
  // Real Estate Specific
  Budget_Min?: number;
  Budget_Max?: number;
  Preferred_Location?: string;
  Property_Type?: string; // '2BHK', '3BHK', 'Villa', 'Plot'
  Purpose?: string; // 'Investment', 'Self Use'
  
  // Lead Source
  Lead_Source?: string;
  Lead_Status?: string;
  Lead_Score?: number;
  
  // Indian Specific
  Aadhaar_Number?: string;
  PAN_Number?: string;
  
  // Custom Fields (use API names)
  [key: string]: any;
}

export interface ZohoDeal {
  id?: string;
  Deal_Name: string;
  Amount?: number;
  Stage?: string;
  Closing_Date?: string;
  
  // Property Details
  Property_Name?: string;
  Property_Type?: string;
  Property_Location?: string;
  Property_Size?: string;
  Property_Price?: number;
  
  // Contact Association
  Contact_Name?: {
    id: string;
    name: string;
  };
  
  // Real Estate Specific
  Token_Amount?: number;
  Registration_Charges?: number;
  Stamp_Duty?: number;
  Brokerage?: number;
  
  // RERA
  RERA_Number?: string;
  
  [key: string]: any;
}

export interface ZohoCustomModule {
  api_name: string;
  module_name: string;
  fields: ZohoField[];
}

export interface ZohoField {
  api_name: string;
  field_label: string;
  data_type: string;
  required?: boolean;
  custom_field?: boolean;
}

export interface SyncResult {
  success: boolean;
  zoho_id?: string;
  error?: string;
  error_code?: string;
}

export interface ZohoTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  api_domain: string;
  token_type: string;
}

// =============================================
// ZOHO CLIENT CLASS
// =============================================
export class ZohoClient {
  private axios: AxiosInstance;
  private supabase: Awaited<ReturnType<typeof createClient>> | null = null;

  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private accountsUrl: string;
  private apiDomain: string;
  
  // Rate limiting
  private requestQueue: Promise<any>[] = [];
  private readonly MAX_REQUESTS_PER_MINUTE = 100;
  private requestCount = 0;
  private resetTime = Date.now() + 60000;

  constructor() {
    this.clientId = process.env.ZOHO_CLIENT_ID || '';
    this.clientSecret = process.env.ZOHO_CLIENT_SECRET || '';
    this.redirectUri = process.env.ZOHO_REDIRECT_URI || '';
    this.accountsUrl = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in';
    this.apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';

    // Validate configuration (non-blocking in constructor)
    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      console.warn('Zoho CRM credentials not fully configured. Some features may not work.');
      console.warn('Required environment variables: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REDIRECT_URI');
    }

    this.axios = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleApiError(error)
    );
  }

  /**
   * Lazy-load Supabase client (must be called during request handling)
   */
  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient();
    }
    return this.supabase;
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(builder_id: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: process.env.ZOHO_SCOPE || 'ZohoCRM.modules.ALL',
      state: builder_id,
    });

    return `${this.accountsUrl}/oauth/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<ZohoTokens> {
    try {
      const response = await axios.post(
        `${this.accountsUrl}/oauth/v2/token`,
        qs.stringify({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          code,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
        api_domain: response.data.api_domain || this.apiDomain,
        token_type: response.data.token_type,
      };
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', error.response?.data || error.message);
      throw new Error(`Failed to exchange code: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refresh_token: string): Promise<ZohoTokens> {
    try {
      const response = await axios.post(
        `${this.accountsUrl}/oauth/v2/token`,
        qs.stringify({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        access_token: response.data.access_token,
        refresh_token: refresh_token, // Refresh token stays the same
        expires_in: response.data.expires_in,
        api_domain: response.data.api_domain || this.apiDomain,
        token_type: response.data.token_type,
      };
    } catch (error: any) {
      console.error('Error refreshing token:', error.response?.data || error.message);
      throw new Error(`Failed to refresh token: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Save Zoho connection to database
   */
  async saveConnection(params: {
    builder_id: string;
    tokens: ZohoTokens;
  }): Promise<void> {
    const expiresAt = new Date(Date.now() + params.tokens.expires_in * 1000);

    // Get organization info
    const orgInfo = await this.getOrganization(params.tokens.access_token, params.tokens.api_domain);

    // Save to database
    const { error } = await (await this.getSupabase())
      .from('integrations')
      .upsert({
        builder_id: params.builder_id,
        integration_type: 'crm',
        provider: 'zoho',
        config: {
          access_token: params.tokens.access_token,
          refresh_token: params.tokens.refresh_token,
          expires_at: expiresAt.toISOString(),
          api_domain: params.tokens.api_domain,
        },
        crm_account_id: orgInfo.org_id,
        crm_account_name: orgInfo.company_name,
        is_active: true,
        is_connected: true,
      }, {
        onConflict: 'builder_id,integration_type,provider',
      });

    if (error) throw error;

    // Set up default field mappings
    await this.createDefaultFieldMappings(params.builder_id);
  }

  /**
   * Load and refresh credentials
   */
  private async loadCredentials(builder_id: string): Promise<{
    access_token: string;
    api_domain: string;
  } | null> {
    const { data: integration, error } = await (await this.getSupabase())
      .from('integrations')
      .select('*')
      .eq('builder_id', builder_id)
      .eq('integration_type', 'crm')
      .eq('provider', 'zoho')
      .eq('is_active', true)
      .single();

    if (error || !integration) {
      return null;
    }

    const config = integration.config as any;
    const expiresAt = new Date(config.expires_at);

    // Check if token needs refresh (5 minutes buffer)
    if (expiresAt.getTime() - Date.now() < 300000) {
      try {
        const newTokens = await this.refreshAccessToken(config.refresh_token);
        
        // Update tokens in database
        await (await this.getSupabase())
          .from('integrations')
          .update({
            config: {
              access_token: newTokens.access_token,
              refresh_token: newTokens.refresh_token,
              expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
              api_domain: newTokens.api_domain,
            },
          })
          .eq('id', integration.id);

        return {
          access_token: newTokens.access_token,
          api_domain: newTokens.api_domain,
        };
      } catch (error) {
        console.error('Failed to refresh token:', error);
        
        // Mark integration as disconnected
        await (await this.getSupabase())
          .from('integrations')
          .update({
            is_connected: false,
            last_error: 'Token refresh failed',
          })
          .eq('id', integration.id);

        return null;
      }
    }

    return {
      access_token: config.access_token,
      api_domain: config.api_domain || this.apiDomain,
    };
  }

  /**
   * Get organization info
   */
  private async getOrganization(access_token: string, api_domain: string): Promise<{
    org_id: string;
    company_name: string;
  }> {
    try {
      const response = await axios.get(
        `${api_domain}/crm/v2/org`,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${access_token}`,
          },
        }
      );

      const org = response.data.org[0];
      return {
        org_id: org.zgid,
        company_name: org.company_name,
      };
    } catch (error) {
      console.error('Error fetching organization:', error);
      return {
        org_id: 'unknown',
        company_name: 'Unknown Organization',
      };
    }
  }

  /**
   * Make rate-limited API request
   */
  private async makeRequest<T>(
    method: string,
    url: string,
    access_token: string,
    data?: any
  ): Promise<T> {
    // Check rate limit
    await this.checkRateLimit();

    try {
      const response = await this.axios({
        method,
        url,
        headers: {
          'Authorization': `Zoho-oauthtoken ${access_token}`,
        },
        data,
      });

      this.requestCount++;
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Rate limiting check
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();

    // Reset counter if minute has passed
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + 60000;
    }

    // Wait if limit reached
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      const waitTime = this.resetTime - now;
      console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.resetTime = Date.now() + 60000;
    }
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: AxiosError): Promise<never> {
    const response = error.response;

    if (response) {
      const data: any = response.data;
      const errorCode = data?.code;
      const errorMessage = data?.message || data?.error || 'Unknown error';

      // Common Zoho error codes
      switch (errorCode) {
        case 'INVALID_TOKEN':
        case 'AUTHENTICATION_FAILURE':
          throw new Error('Authentication failed. Please reconnect Zoho CRM.');
        
        case 'MANDATORY_NOT_FOUND':
          throw new Error(`Missing required fields: ${errorMessage}`);
        
        case 'DUPLICATE_DATA':
          throw new Error('Duplicate record found.');
        
        case 'INVALID_DATA':
          throw new Error(`Invalid data: ${errorMessage}`);
        
        case 'LIMIT_EXCEEDED':
          throw new Error('API rate limit exceeded. Please try again later.');
        
        default:
          throw new Error(`Zoho API Error (${errorCode}): ${errorMessage}`);
      }
    }

    throw error;
  }

  /**
   * Create or update contact in Zoho
   */
  async syncContactToZoho(params: {
    builder_id: string;
    lead_id: string;
    lead_data: any;
  }): Promise<SyncResult> {
    try {
      const credentials = await this.loadCredentials(params.builder_id);
      if (!credentials) {
        return { success: false, error: 'Zoho CRM not connected' };
      }

      // Map fields to Zoho format
      const contactData = await this.mapLeadToZohoContact(params.builder_id, params.lead_data);

      // Check if contact already exists
      const integrationId = await this.getIntegrationId(params.builder_id);
      if (!integrationId) {
        return { success: false, error: 'Integration not found' };
      }

      const { data: existingMapping } = await (await this.getSupabase())
        .from('crm_record_mappings')
        .select('crm_id')
        .eq('integration_id', integrationId)
        .eq('record_type', 'lead')
        .eq('tharaga_id', params.lead_id)
        .single();

      let contactId: string;

      if (existingMapping?.crm_id) {
        // Update existing contact
        const response = await this.makeRequest<any>(
          'PUT',
          `${credentials.api_domain}/crm/v2/Contacts/${existingMapping.crm_id}`,
          credentials.access_token,
          {
            data: [contactData],
            trigger: ['workflow'],
          }
        );

        if (response.data?.[0]?.code === 'SUCCESS') {
          contactId = existingMapping.crm_id;
        } else {
          throw new Error(response.data?.[0]?.message || 'Update failed');
        }
      } else {
        // Create new contact
        const response = await this.makeRequest<any>(
          'POST',
          `${credentials.api_domain}/crm/v2/Contacts`,
          credentials.access_token,
          {
            data: [contactData],
            trigger: ['workflow'],
          }
        );

        if (response.data?.[0]?.code === 'SUCCESS') {
          contactId = response.data[0].details.id;

          // Save mapping
          await this.saveCRMMapping({
            builder_id: params.builder_id,
            record_type: 'lead',
            tharaga_id: params.lead_id,
            crm_id: contactId,
          });
        } else {
          throw new Error(response.data?.[0]?.message || 'Create failed');
        }
      }

      // Log sync
      await this.logSync({
        builder_id: params.builder_id,
        sync_type: 'lead',
        sync_direction: 'to_crm',
        tharaga_id: params.lead_id,
        crm_id: contactId,
        status: 'success',
      });

      return {
        success: true,
        zoho_id: contactId,
      };
    } catch (error: any) {
      console.error('Error syncing contact to Zoho:', error);

      // Log failed sync
      await this.logSync({
        builder_id: params.builder_id,
        sync_type: 'lead',
        sync_direction: 'to_crm',
        tharaga_id: params.lead_id,
        status: 'failed',
        error_message: error.message,
      });

      return {
        success: false,
        error: error.message,
        error_code: error.code,
      };
    }
  }

  /**
   * Create or update deal in Zoho
   */
  async syncDealToZoho(params: {
    builder_id: string;
    lead_id: string;
    property_id: string;
    deal_data: any;
  }): Promise<SyncResult> {
    try {
      const credentials = await this.loadCredentials(params.builder_id);
      if (!credentials) {
        return { success: false, error: 'Zoho CRM not connected' };
      }

      // Get contact ID for association
      const integrationId = await this.getIntegrationId(params.builder_id);
      if (!integrationId) {
        return { success: false, error: 'Integration not found' };
      }

      const { data: contactMapping } = await (await this.getSupabase())
        .from('crm_record_mappings')
        .select('crm_id')
        .eq('integration_id', integrationId)
        .eq('record_type', 'lead')
        .eq('tharaga_id', params.lead_id)
        .single();

      if (!contactMapping?.crm_id) {
        return {
          success: false,
          error: 'Contact must be synced before creating deal',
        };
      }

      // Build deal data
      const dealData: ZohoDeal = {
        Deal_Name: params.deal_data.property_title || 'New Property Deal',
        Amount: params.deal_data.property_price,
        Stage: this.mapDealStage(params.deal_data.stage),
        Closing_Date: params.deal_data.expected_close_date,
        
        // Property details
        Property_Name: params.deal_data.property_title,
        Property_Type: params.deal_data.property_type,
        Property_Location: params.deal_data.property_location,
        Property_Size: params.deal_data.property_size,
        Property_Price: params.deal_data.property_price,
        
        // Contact association
        Contact_Name: {
          id: contactMapping.crm_id,
          name: params.deal_data.lead_name,
        },
        
        // Financial details
        Token_Amount: params.deal_data.token_amount,
        Registration_Charges: params.deal_data.registration_charges,
        Stamp_Duty: params.deal_data.stamp_duty,
        
        // RERA
        RERA_Number: params.deal_data.rera_number,
      };

      // Check if deal exists
      const { data: existingMapping } = await (await this.getSupabase())
        .from('crm_record_mappings')
        .select('crm_id')
        .eq('integration_id', integrationId)
        .eq('record_type', 'deal')
        .eq('tharaga_id', params.property_id)
        .single();

      let dealId: string;

      if (existingMapping?.crm_id) {
        // Update existing deal
        const response = await this.makeRequest<any>(
          'PUT',
          `${credentials.api_domain}/crm/v2/Deals/${existingMapping.crm_id}`,
          credentials.access_token,
          {
            data: [dealData],
            trigger: ['workflow'],
          }
        );

        if (response.data?.[0]?.code === 'SUCCESS') {
          dealId = existingMapping.crm_id;
        } else {
          throw new Error(response.data?.[0]?.message || 'Update failed');
        }
      } else {
        // Create new deal
        const response = await this.makeRequest<any>(
          'POST',
          `${credentials.api_domain}/crm/v2/Deals`,
          credentials.access_token,
          {
            data: [dealData],
            trigger: ['workflow'],
          }
        );

        if (response.data?.[0]?.code === 'SUCCESS') {
          dealId = response.data[0].details.id;

          // Save mapping
          await this.saveCRMMapping({
            builder_id: params.builder_id,
            record_type: 'deal',
            tharaga_id: params.property_id,
            crm_id: dealId,
          });
        } else {
          throw new Error(response.data?.[0]?.message || 'Create failed');
        }
      }

      // Log sync
      await this.logSync({
        builder_id: params.builder_id,
        sync_type: 'deal',
        sync_direction: 'to_crm',
        tharaga_id: params.property_id,
        crm_id: dealId,
        status: 'success',
      });

      return {
        success: true,
        zoho_id: dealId,
      };
    } catch (error: any) {
      console.error('Error syncing deal to Zoho:', error);
      await this.logSync({
        builder_id: params.builder_id,
        sync_type: 'deal',
        sync_direction: 'to_crm',
        tharaga_id: params.property_id,
        status: 'failed',
        error_message: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Sync contact from Zoho to Tharaga
   */
  async syncContactFromZoho(params: {
    builder_id: string;
    contact_id: string;
  }): Promise<SyncResult> {
    try {
      const credentials = await this.loadCredentials(params.builder_id);
      if (!credentials) {
        return { success: false, error: 'Zoho CRM not connected' };
      }

      // Get contact from Zoho
      const response = await this.makeRequest<any>(
        'GET',
        `${credentials.api_domain}/crm/v2/Contacts/${params.contact_id}`,
        credentials.access_token
      );

      const contact = response.data[0];

      // Map fields back to Tharaga format
      const leadData = await this.mapZohoContactToLead(params.builder_id, contact);

      // Check if lead exists
      const integrationId = await this.getIntegrationId(params.builder_id);
      if (!integrationId) {
        return { success: false, error: 'Integration not found' };
      }

      const { data: existingMapping } = await (await this.getSupabase())
        .from('crm_record_mappings')
        .select('tharaga_id')
        .eq('integration_id', integrationId)
        .eq('record_type', 'lead')
        .eq('crm_id', params.contact_id)
        .single();

      let leadId: string;

      if (existingMapping?.tharaga_id) {
        // Update existing lead
        await (await this.getSupabase())
          .from('auth.users')
          .update({
            email: leadData.email,
            phone: leadData.phone,
            raw_user_meta_data: {
              full_name: leadData.full_name,
              budget_min: leadData.budget_min,
              budget_max: leadData.budget_max,
              preferred_location: leadData.preferred_location,
              preferred_property_type: leadData.preferred_property_type,
            },
          })
          .eq('id', existingMapping.tharaga_id);

        leadId = existingMapping.tharaga_id;
      } else {
        // Create new lead
        const { data: newLead, error } = await (await this.getSupabase()).auth.admin.createUser({
          email: leadData.email,
          email_confirm: true,
          phone: leadData.phone,
          user_metadata: {
            full_name: leadData.full_name,
            budget_min: leadData.budget_min,
            budget_max: leadData.budget_max,
            preferred_location: leadData.preferred_location,
            preferred_property_type: leadData.preferred_property_type,
            user_type: 'buyer',
            source: 'zoho_sync',
          },
        });

        if (error) throw error;
        leadId = newLead.user.id;

        // Save mapping
        await this.saveCRMMapping({
          builder_id: params.builder_id,
          record_type: 'lead',
          tharaga_id: leadId,
          crm_id: params.contact_id,
        });
      }

      // Log sync
      await this.logSync({
        builder_id: params.builder_id,
        sync_type: 'lead',
        sync_direction: 'from_crm',
        tharaga_id: leadId,
        crm_id: params.contact_id,
        status: 'success',
      });

      return {
        success: true,
        zoho_id: leadId,
      };
    } catch (error: any) {
      console.error('Error syncing contact from Zoho:', error);
      await this.logSync({
        builder_id: params.builder_id,
        sync_type: 'lead',
        sync_direction: 'from_crm',
        crm_id: params.contact_id,
        status: 'failed',
        error_message: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Search contacts in Zoho
   */
  async searchContacts(params: {
    builder_id: string;
    email?: string;
    phone?: string;
    name?: string;
  }): Promise<any[]> {
    try {
      const credentials = await this.loadCredentials(params.builder_id);
      if (!credentials) {
        return [];
      }

      let criteria = '';

      if (params.email) {
        criteria = `(Email:equals:${params.email})`;
      } else if (params.phone) {
        const cleanPhone = params.phone.replace(/\D/g, '');
        criteria = `(Phone:equals:${cleanPhone})or(Mobile:equals:${cleanPhone})`;
      } else if (params.name) {
        criteria = `(Full_Name:equals:${params.name})`;
      }

      if (!criteria) {
        return [];
      }

      const response = await this.makeRequest<any>(
        'GET',
        `${credentials.api_domain}/crm/v2/Contacts/search?criteria=${encodeURIComponent(criteria)}`,
        credentials.access_token
      );

      return response.data || [];
    } catch (error: any) {
      console.error('Error searching contacts:', error);
      return [];
    }
  }

  /**
   * Batch sync contacts
   */
  async batchSyncContacts(params: {
    builder_id: string;
    lead_ids: string[];
  }): Promise<{ successful: number; failed: number; results: SyncResult[] }> {
    const results: SyncResult[] = [];
    let successful = 0;
    let failed = 0;

    // Zoho allows batch insert of max 100 records
    const batchSize = 100;

    for (let i = 0; i < params.lead_ids.length; i += batchSize) {
      const batch = params.lead_ids.slice(i, i + batchSize);

      for (const lead_id of batch) {
        // Get lead data
        const { data: lead } = await (await this.getSupabase())
          .from('auth.users')
          .select('*')
          .eq('id', lead_id)
          .single();

        if (!lead) {
          results.push({ success: false, error: 'Lead not found' });
          failed++;
          continue;
        }

        const result = await this.syncContactToZoho({
          builder_id: params.builder_id,
          lead_id,
          lead_data: lead,
        });

        results.push(result);

        if (result.success) {
          successful++;
        } else {
          failed++;
        }

        // Rate limiting: 100 requests per minute
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    return { successful, failed, results };
  }

  /**
   * Handle webhook from Zoho
   */
  async handleWebhook(payload: any): Promise<void> {
    try {
      // Zoho webhooks have this structure:
      // { module: 'Contacts', operation: 'insert', ids: ['123'] }
      
      const { module, operation, ids } = payload;

      console.log('Zoho webhook received:', { module, operation, ids });

      // Handle different operations
      if (module === 'Contacts') {
        for (const contactId of ids || []) {
          if (operation === 'insert' || operation === 'update') {
            // Find builder by checking all integrations
            // In production, you should have a better way to identify this
            const { data: integrations } = await (await this.getSupabase())
              .from('integrations')
              .select('builder_id')
              .eq('integration_type', 'crm')
              .eq('provider', 'zoho')
              .eq('is_active', true);

            // Sync for all active integrations
            // (In practice, you'd want to identify the specific builder)
            for (const integration of integrations || []) {
              await this.syncContactFromZoho({
                builder_id: integration.builder_id,
                contact_id: contactId,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error handling Zoho webhook:', error);
    }
  }

  /**
   * Map Tharaga lead to Zoho contact format
   */
  private async mapLeadToZohoContact(
    builder_id: string,
    leadData: any
  ): Promise<ZohoContact> {
    // Get custom field mappings
    const integrationId = await this.getIntegrationId(builder_id);
    const { data: mappings } = await (await this.getSupabase())
      .from('crm_field_mappings')
      .select('*')
      .eq('integration_id', integrationId!)
      .eq('is_active', true)
      .in('sync_direction', ['to_crm', 'bidirectional']);

    const contact: ZohoContact = {
      Email: leadData.email,
      Full_Name: leadData.raw_user_meta_data?.full_name || leadData.email.split('@')[0],
    };

    // Split name into first and last
    if (contact.Full_Name) {
      const nameParts = contact.Full_Name.split(' ');
      contact.First_Name = nameParts[0];
      contact.Last_Name = nameParts.slice(1).join(' ') || nameParts[0];
    }

    // Phone number (Indian format)
    if (leadData.phone) {
      const cleanPhone = leadData.phone.replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        contact.Mobile = `+91${cleanPhone}`;
      } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
        contact.Mobile = `+${cleanPhone}`;
      } else {
        contact.Mobile = leadData.phone;
      }
    }

    // Real estate specific fields
    if (leadData.raw_user_meta_data?.budget_min) {
      contact.Budget_Min = leadData.raw_user_meta_data.budget_min;
    }

    if (leadData.raw_user_meta_data?.budget_max) {
      contact.Budget_Max = leadData.raw_user_meta_data.budget_max;
    }

    if (leadData.raw_user_meta_data?.preferred_location) {
      contact.Preferred_Location = leadData.raw_user_meta_data.preferred_location;
    }

    if (leadData.raw_user_meta_data?.preferred_property_type) {
      contact.Property_Type = leadData.raw_user_meta_data.preferred_property_type;
    }

    // Lead source
    if (leadData.raw_user_meta_data?.utm_source) {
      contact.Lead_Source = leadData.raw_user_meta_data.utm_source;
    }

    // Apply custom mappings
    for (const mapping of mappings || []) {
      const value = leadData[mapping.tharaga_field] || leadData.raw_user_meta_data?.[mapping.tharaga_field];
      if (value !== undefined && value !== null) {
        contact[mapping.crm_field] = value;
      }
    }

    return contact;
  }

  /**
   * Map Zoho contact to Tharaga lead format
   */
  private async mapZohoContactToLead(
    builder_id: string,
    contact: any
  ): Promise<any> {
    const integrationId = await this.getIntegrationId(builder_id);
    const { data: mappings } = await (await this.getSupabase())
      .from('crm_field_mappings')
      .select('*')
      .eq('integration_id', integrationId!)
      .eq('is_active', true)
      .in('sync_direction', ['from_crm', 'bidirectional']);

    const leadData: any = {
      email: contact.Email,
      full_name: contact.Full_Name || `${contact.First_Name || ''} ${contact.Last_Name || ''}`.trim(),
      phone: contact.Mobile || contact.Phone,
      budget_min: contact.Budget_Min,
      budget_max: contact.Budget_Max,
      preferred_location: contact.Preferred_Location,
      preferred_property_type: contact.Property_Type,
    };

    // Apply custom mappings
    for (const mapping of mappings || []) {
      const value = contact[mapping.crm_field];
      if (value !== undefined && value !== null) {
        leadData[mapping.tharaga_field] = value;
      }
    }

    return leadData;
  }

  /**
   * Map deal stage
   */
  private mapDealStage(stage?: string): string {
    const stageMap: Record<string, string> = {
      new: 'Qualification',
      contacted: 'Needs Analysis',
      qualified: 'Value Proposition',
      proposal: 'Proposal/Price Quote',
      negotiation: 'Negotiation/Review',
      won: 'Closed Won',
      lost: 'Closed Lost',
    };

    return stageMap[stage?.toLowerCase() || 'new'] || 'Qualification';
  }

  /**
   * Create default field mappings
   */
  private async createDefaultFieldMappings(builder_id: string): Promise<void> {
    const integrationId = await this.getIntegrationId(builder_id);
    if (!integrationId) return;

    const defaultMappings = [
      { tharaga_field: 'email', crm_field: 'Email' },
      { tharaga_field: 'full_name', crm_field: 'Full_Name' },
      { tharaga_field: 'phone', crm_field: 'Mobile' },
      { tharaga_field: 'budget_min', crm_field: 'Budget_Min' },
      { tharaga_field: 'budget_max', crm_field: 'Budget_Max' },
      { tharaga_field: 'preferred_location', crm_field: 'Preferred_Location' },
      { tharaga_field: 'preferred_property_type', crm_field: 'Property_Type' },
    ];

    for (const mapping of defaultMappings) {
      await (await this.getSupabase())
        .from('crm_field_mappings')
        .upsert({
          integration_id: integrationId,
          ...mapping,
          transform_type: 'direct',
          sync_direction: 'bidirectional',
          is_active: true,
        }, {
          onConflict: 'integration_id,tharaga_field,crm_field',
        });
    }
  }

  /**
   * Save CRM record mapping
   */
  private async saveCRMMapping(params: {
    builder_id: string;
    record_type: string;
    tharaga_id: string;
    crm_id: string;
  }): Promise<void> {
    const integrationId = await this.getIntegrationId(params.builder_id);
    if (!integrationId) return;

    await (await this.getSupabase())
      .from('crm_record_mappings')
      .upsert({
        integration_id: integrationId,
        record_type: params.record_type,
        tharaga_id: params.tharaga_id,
        crm_id: params.crm_id,
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced',
      }, {
        onConflict: 'integration_id,record_type,tharaga_id',
      });
  }

  /**
   * Log sync operation
   */
  private async logSync(params: {
    builder_id: string;
    sync_type: string;
    sync_direction: string;
    tharaga_id: string;
    crm_id?: string;
    status: string;
    error_message?: string;
  }): Promise<void> {
    const integrationId = await this.getIntegrationId(params.builder_id);
    if (!integrationId) return;

    await (await this.getSupabase())
      .from('crm_sync_log')
      .insert({
        integration_id: integrationId,
        sync_type: params.sync_type,
        sync_direction: params.sync_direction,
        tharaga_id: params.tharaga_id,
        crm_id: params.crm_id,
        status: params.status,
        error_message: params.error_message,
        sync_completed_at: new Date().toISOString(),
      });
  }

  /**
   * Get integration ID
   */
  private async getIntegrationId(builder_id: string): Promise<string | null> {
    const { data } = await (await this.getSupabase())
      .from('integrations')
      .select('id')
      .eq('builder_id', builder_id)
      .eq('integration_type', 'crm')
      .eq('provider', 'zoho')
      .eq('is_active', true)
      .single();

    return data?.id || null;
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(builder_id: string): Promise<{
    connected: boolean;
    account_name?: string;
    last_sync_at?: string;
    total_synced?: number;
  }> {
    const { data: integration } = await (await this.getSupabase())
      .from('integrations')
      .select('*')
      .eq('builder_id', builder_id)
      .eq('integration_type', 'crm')
      .eq('provider', 'zoho')
      .eq('is_active', true)
      .single();

    if (!integration || !integration.is_connected) {
      return { connected: false };
    }

    return {
      connected: true,
      account_name: integration.crm_account_name || undefined,
      last_sync_at: integration.last_sync_at || undefined,
      total_synced: integration.successful_actions || 0,
    };
  }
}

// Export singleton instance
export const zohoClient = new ZohoClient();

