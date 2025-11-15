// =============================================
// ENVIRONMENT VARIABLES VALIDATION
// Validates Zoho CRM configuration
// =============================================

export interface ZohoEnvConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accountsUrl: string;
  apiDomain: string;
  scope: string;
}

export function validateZohoEnv(): {
  valid: boolean;
  config?: ZohoEnvConfig;
  errors: string[];
} {
  const errors: string[] = [];
  
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const redirectUri = process.env.ZOHO_REDIRECT_URI;
  const accountsUrl = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in';
  const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';
  const scope = process.env.ZOHO_SCOPE || 'ZohoCRM.modules.ALL';

  if (!clientId) {
    errors.push('ZOHO_CLIENT_ID is not set');
  }

  if (!clientSecret) {
    errors.push('ZOHO_CLIENT_SECRET is not set');
  }

  if (!redirectUri) {
    errors.push('ZOHO_REDIRECT_URI is not set');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  return {
    valid: true,
    config: {
      clientId: clientId!,
      clientSecret: clientSecret!,
      redirectUri: redirectUri!,
      accountsUrl,
      apiDomain,
      scope,
    },
    errors: [],
  };
}

export function getZohoEnvConfig(): ZohoEnvConfig {
  const validation = validateZohoEnv();
  
  if (!validation.valid || !validation.config) {
    throw new Error(
      `Zoho CRM configuration is invalid: ${validation.errors.join(', ')}`
    );
  }

  return validation.config;
}







