import { NextRequest, NextResponse } from 'next/server'
import { secureApiRoute } from '@/lib/security/api-security'
import { Permissions } from '@/lib/security/permissions'

/**
 * GET /api/crm/zoho/dashboard-data
 *
 * Returns mock/sample CRM data for the inline dashboard
 * In production, this would fetch real data from ZOHO CRM API
 */
export const GET = secureApiRoute(
  async (request: NextRequest, user) => {
    try {
      // For now, return mock data
      // In production, fetch from ZOHO CRM API using stored credentials
      const mockData = {
        stats: {
          total_contacts: 247,
          new_contacts_this_month: 23,
          active_deals: 12,
          deal_value: 8500000, // ₹85 lakhs
          conversion_rate: 32
        },
        contacts: [
          {
            id: '1',
            name: 'Rajesh Kumar',
            email: 'rajesh.k@example.com',
            phone: '+91 98765 43210',
            status: 'active',
            created_at: '2025-01-15'
          },
          {
            id: '2',
            name: 'Priya Sharma',
            email: 'priya.sharma@example.com',
            phone: '+91 98765 43211',
            status: 'active',
            created_at: '2025-01-14'
          },
          {
            id: '3',
            name: 'Amit Patel',
            email: 'amit.p@example.com',
            phone: '+91 98765 43212',
            status: 'active',
            created_at: '2025-01-13'
          },
          {
            id: '4',
            name: 'Sneha Reddy',
            email: 'sneha.r@example.com',
            phone: '+91 98765 43213',
            status: 'active',
            created_at: '2025-01-12'
          },
          {
            id: '5',
            name: 'Vikram Singh',
            email: 'vikram.s@example.com',
            phone: '+91 98765 43214',
            status: 'active',
            created_at: '2025-01-11'
          }
        ],
        deals: [
          {
            id: '1',
            name: 'Premium Villa - Koramangala',
            account_name: 'Rajesh Kumar',
            amount: 3500000,
            stage: 'Negotiation',
            probability: 75,
            closing_date: '2025-02-15'
          },
          {
            id: '2',
            name: '3BHK Apartment - Whitefield',
            account_name: 'Priya Sharma',
            amount: 2200000,
            stage: 'Proposal',
            probability: 60,
            closing_date: '2025-02-28'
          },
          {
            id: '3',
            name: 'Luxury Penthouse - Indiranagar',
            account_name: 'Amit Patel',
            amount: 5500000,
            stage: 'Contract Sent',
            probability: 90,
            closing_date: '2025-02-05'
          },
          {
            id: '4',
            name: '2BHK Apartment - Electronic City',
            account_name: 'Sneha Reddy',
            amount: 1500000,
            stage: 'Qualification',
            probability: 40,
            closing_date: '2025-03-15'
          }
        ]
      }

      return NextResponse.json(mockData, { status: 200 })
    } catch (error: any) {
      console.error('[CRM Dashboard Data Error]:', error)
      return NextResponse.json(
        { error: 'Failed to fetch CRM data', message: error.message },
        { status: 500 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: ['builder', 'admin'],
    requirePermission: Permissions.LEAD_VIEW,
    allowedMethods: ['GET']
  }
)
