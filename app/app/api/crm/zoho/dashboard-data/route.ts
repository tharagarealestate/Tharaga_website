import { NextRequest, NextResponse } from 'next/server'
import { secureApiRoute } from '@/lib/security/api-security'
import { Permissions } from '@/lib/security/permissions'
import { createClient } from '@/lib/supabase/server'
import { ZohoClient } from '@/lib/integrations/crm/zohoClient'

/**
 * GET /api/crm/zoho/dashboard-data
 *
 * Fetches real-time CRM data from ZOHO CRM API
 * Shows contacts, deals, and statistics for the inline dashboard
 */
export const GET = secureApiRoute(
  async (request: NextRequest, user) => {
    try {
      const supabase = await createClient()
      const zohoClient = new ZohoClient()

      // Check if Zoho CRM is connected
      const { data: integration } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'zoho')
        .eq('type', 'crm')
        .single()

      // If not connected, return mock data with flag
      if (!integration || !integration.connected) {
        return NextResponse.json({
          connected: false,
          mock: true,
          message: 'Zoho CRM not connected. Showing sample data.',
          stats: {
            total_contacts: 0,
            new_contacts_this_month: 0,
            active_deals: 0,
            deal_value: 0,
            conversion_rate: 0
          },
          contacts: [],
          deals: []
        }, { status: 200 })
      }

      // Load credentials and fetch real data from Zoho
      const credentials = await zohoClient.loadCredentials(user.id)

      if (!credentials) {
        throw new Error('Failed to load Zoho credentials')
      }

      // Fetch contacts and deals in parallel
      const [contactsResponse, dealsResponse] = await Promise.all([
        zohoClient.makeRequest(
          'GET',
          `${credentials.api_domain}/crm/v2/Contacts`,
          credentials.access_token,
          undefined,
          { per_page: 200, sort_by: 'Created_Time', sort_order: 'desc' }
        ),
        zohoClient.makeRequest(
          'GET',
          `${credentials.api_domain}/crm/v2/Deals`,
          credentials.access_token,
          undefined,
          { per_page: 200, sort_by: 'Created_Time', sort_order: 'desc' }
        )
      ])

      // Process contacts
      const contacts = (contactsResponse.data || []).map((contact: any) => ({
        id: contact.id,
        name: contact.Full_Name || `${contact.First_Name || ''} ${contact.Last_Name || ''}`.trim(),
        email: contact.Email,
        phone: contact.Phone || contact.Mobile,
        status: contact.Lead_Status || 'active',
        created_at: contact.Created_Time,
        lead_score: contact.Lead_Score || 0,
        budget_min: contact.Budget_Min,
        budget_max: contact.Budget_Max,
        preferred_location: contact.Preferred_Location,
        property_type: contact.Property_Type
      }))

      // Process deals
      const deals = (dealsResponse.data || []).map((deal: any) => ({
        id: deal.id,
        name: deal.Deal_Name,
        account_name: deal.Contact_Name?.name || deal.Account_Name?.name || 'Unknown',
        amount: deal.Amount || 0,
        stage: deal.Stage,
        probability: deal.Probability || 0,
        closing_date: deal.Closing_Date,
        property_name: deal.Property_Name,
        property_location: deal.Property_Location,
        property_type: deal.Property_Type,
        created_at: deal.Created_Time
      }))

      // Calculate statistics
      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const newContactsThisMonth = contacts.filter(
        (c: any) => new Date(c.created_at) >= thisMonthStart
      ).length

      const activeDeals = deals.filter(
        (d: any) => !['Closed Won', 'Closed Lost', 'Closed-Won', 'Closed-Lost'].includes(d.stage)
      )

      const totalDealValue = activeDeals.reduce((sum: number, d: any) => sum + (d.amount || 0), 0)

      const closedWonDeals = deals.filter(
        (d: any) => ['Closed Won', 'Closed-Won'].includes(d.stage)
      )

      const conversionRate = deals.length > 0
        ? Math.round((closedWonDeals.length / deals.length) * 100)
        : 0

      return NextResponse.json({
        connected: true,
        mock: false,
        stats: {
          total_contacts: contacts.length,
          new_contacts_this_month: newContactsThisMonth,
          active_deals: activeDeals.length,
          deal_value: totalDealValue,
          conversion_rate: conversionRate
        },
        contacts: contacts.slice(0, 50), // Return top 50 contacts
        deals: activeDeals.slice(0, 50) // Return top 50 active deals
      }, { status: 200 })

    } catch (error: any) {
      console.error('[CRM Dashboard Data Error]:', error)

      // Return mock data with error flag for graceful degradation
      return NextResponse.json({
        connected: false,
        mock: true,
        error: true,
        message: error.message || 'Failed to fetch CRM data',
        stats: {
          total_contacts: 0,
          new_contacts_this_month: 0,
          active_deals: 0,
          deal_value: 0,
          conversion_rate: 0
        },
        contacts: [],
        deals: []
      }, { status: 200 }) // Return 200 to prevent UI errors
    }
  },
  {
    requireAuth: true,
    requireRole: ['builder', 'admin'],
    requirePermission: Permissions.LEAD_VIEW,
    allowedMethods: ['GET']
  }
)
