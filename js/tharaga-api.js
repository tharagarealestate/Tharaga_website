/**
 * Tharaga API Client v1.0
 * Production-grade API client for Tharaga backend
 * 
 * Usage:
 *   <script src="/js/tharaga-api.js"></script>
 *   await tharagaAPI.leads.create({ name, phone, ... })
 */

(function (window) {
  'use strict';

  // Detect API base URL
  // In production: https://api.tharaga.co.in (via /api proxy)
  // In dev: http://localhost:8001
  const API_BASE = window.THARAGA_API_BASE || '/api/v1';

  // Helper: make API request with retry
  async function apiRequest(path, options = {}) {
    const url = path.startsWith('http') ? path : API_BASE + path;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    // Default timeout: 15 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 15000);
    config.signal = controller.signal;
    
    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      const contentType = response.headers.get('content-type');
      const data = contentType?.includes('application/json') 
        ? await response.json()
        : await response.text();
      
      if (!response.ok) {
        throw {
          status: response.status,
          message: data?.detail || data?.message || 'Request failed',
          data
        };
      }
      
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw { status: 408, message: 'Request timeout' };
      }
      throw err;
    }
  }

  // ========== LEADS API ==========
  const leads = {
    /**
     * Create a new lead with SmartScore AI scoring
     * @param {Object} data - Lead data
     * @returns {Promise<Object>} Created lead with score
     */
    async create(data) {
      // Auto-capture attribution data
      const enriched = {
        ...data,
        landing_page: data.landing_page || window.location.pathname,
        referrer: data.referrer || document.referrer,
        user_agent: data.user_agent || navigator.userAgent,
        utm_source: data.utm_source || getURLParam('utm_source'),
        utm_medium: data.utm_medium || getURLParam('utm_medium'),
        utm_campaign: data.utm_campaign || getURLParam('utm_campaign'),
        fbp: data.fbp || getCookie('_fbp'),
        fbc: data.fbc || getCookie('_fbc')
      };
      
      return apiRequest('/leads/', {
        method: 'POST',
        body: JSON.stringify(enriched)
      });
    },
    
    async get(leadId) {
      return apiRequest(`/leads/${leadId}`);
    },
    
    async getScore(leadId) {
      return apiRequest(`/leads/${leadId}/score`);
    },
    
    async updateStatus(leadId, status, notes) {
      return apiRequest(`/leads/${leadId}/status?status=${status}${notes ? '&notes=' + encodeURIComponent(notes) : ''}`, {
        method: 'PUT'
      });
    },
    
    async qualify(leadId, qualificationData) {
      return apiRequest(`/leads/${leadId}/qualify`, {
        method: 'POST',
        body: JSON.stringify(qualificationData)
      });
    },
    
    async getActivities(leadId) {
      return apiRequest(`/leads/${leadId}/activities`);
    },
    
    async getByTier(tier, limit = 50) {
      return apiRequest(`/leads/tier/${tier}?limit=${limit}`);
    },
    
    async search(filters = {}) {
      const params = new URLSearchParams(filters).toString();
      return apiRequest(`/leads/?${params}`);
    }
  };

  // ========== PROPERTIES API ==========
  const properties = {
    async create(data) {
      return apiRequest('/properties/', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    async get(propertyId) {
      return apiRequest(`/properties/${propertyId}`);
    },
    
    async search(filters = {}) {
      return apiRequest('/properties/search', {
        method: 'POST',
        body: JSON.stringify(filters)
      });
    },
    
    async getScore(propertyId) {
      return apiRequest(`/properties/${propertyId}/score`);
    },
    
    async verifyRera(reraId) {
      return apiRequest(`/properties/verify-rera?rera_id=${encodeURIComponent(reraId)}`, {
        method: 'POST'
      });
    }
  };

  // ========== ANALYTICS API ==========
  const analytics = {
    async getLiveMetrics() {
      return apiRequest('/analytics/live-metrics');
    },
    
    async getMarketData(city = 'Chennai') {
      return apiRequest(`/analytics/market-data?city=${encodeURIComponent(city)}`);
    },
    
    async getLocalityInsights(city, locality) {
      return apiRequest(`/analytics/locality-insights?city=${encodeURIComponent(city)}&locality=${encodeURIComponent(locality)}`);
    }
  };

  // ========== AI TOOLS API ==========
  const tools = {
    async calculateROI(data) {
      return apiRequest('/tools/roi-calculator', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    async calculateEMI(data) {
      return apiRequest('/tools/emi-calculator', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    async planBudget(data) {
      return apiRequest('/tools/budget-planner', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    async checkLoanEligibility(data) {
      return apiRequest('/tools/loan-eligibility', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    async valueProperty(data) {
      return apiRequest('/tools/property-valuation', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  };

  // ========== BUILDERS API ==========
  const builders = {
    async get(builderId) {
      return apiRequest(`/builders/${builderId}`);
    },
    
    async getDashboard(builderId) {
      return apiRequest(`/builders/${builderId}/dashboard`);
    },
    
    async getProperties(builderId) {
      return apiRequest(`/builders/${builderId}/properties`);
    }
  };

  // ========== INTEGRATIONS API ==========
  const integrations = {
    async trackMetaEvent(eventName, leadId, userData, customData) {
      return apiRequest('/integrations/meta-capi/event', {
        method: 'POST',
        body: JSON.stringify({ event_name: eventName, lead_id: leadId, user_data: userData, custom_data: customData })
      });
    },
    
    async sendWhatsApp(phone, message, leadId) {
      return apiRequest('/integrations/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({ phone, message, lead_id: leadId })
      });
    }
  };

  // ========== UTILITIES ==========
  function getURLParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  // ========== EXPORT ==========
  window.tharagaAPI = {
    leads,
    properties,
    analytics,
    tools,
    builders,
    integrations,
    
    // Direct access
    request: apiRequest,
    
    // Configuration
    setBaseURL(url) {
      // Cannot reassign const, but apps can override window.THARAGA_API_BASE
      console.warn('Set window.THARAGA_API_BASE before loading this script');
    },
    
    version: '1.0.0'
  };

  console.log('✅ Tharaga API Client v1.0 loaded. Base:', API_BASE);

})(window);
