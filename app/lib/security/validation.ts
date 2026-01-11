// Input validation schemas using Zod

import { z } from 'zod'

/**
 * Contact form validation schema
 */
export const ContactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number (must be 10 digits starting with 6-9)'),
  message: z.string().max(1000, 'Message too long').optional().or(z.literal('')),
  property_id: z.string().uuid('Invalid property ID').optional(),
  builder_id: z.string().uuid('Invalid builder ID').optional()
})

/**
 * Lead submission validation schema
 */
export const LeadSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  email: z.string().email().optional().or(z.literal('')),
  budget: z.number().positive().optional(),
  property_id: z.string().uuid().optional(),
  builder_id: z.string().uuid().optional(),
  source: z.string().max(200).optional(),
  message: z.string().max(1000).optional()
})

/**
 * Property creation/update validation schema
 */
export const PropertySchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  location: z.string().min(3).max(200),
  city: z.string().min(2).max(100),
  price: z.number().positive(),
  sqft: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  property_type: z.string().max(50).optional(),
  verified: z.boolean().optional()
})

/**
 * User profile validation schema
 */
export const ProfileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().max(500).optional()
})

/**
 * Admin settings validation schema
 */
export const AdminSettingsSchema = z.object({
  setting_key: z.string().min(1).max(100),
  setting_value: z.string().max(1000)
})

/**
 * Search query validation schema
 */
export const SearchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  city: z.string().max(100).optional(),
  ptype: z.string().max(50).optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().positive().optional(),
  bedroomsMin: z.number().int().min(0).max(20).optional(),
  bathroomsMin: z.number().int().min(0).max(20).optional(),
  verifiedOnly: z.boolean().optional(),
  wantMetro: z.boolean().optional(),
  k: z.number().int().min(1).max(100).optional()
})

/**
 * Generic validation helper
 */
export async function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const validated = await schema.parseAsync(data)
    return { success: true, data: validated }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false,
        error: err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      }
    }
    return {
      success: false,
      error: 'Validation failed'
    }
  }
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '')
  
  // Remove potential SQL injection patterns (but preserve legitimate quotes)
  sanitized = sanitized.replace(/['";\\]/g, '')
  
  // Remove potential XSS patterns
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '')
  sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
  sanitized = sanitized.replace(/javascript:/gi, '')
  sanitized = sanitized.replace(/on\w+\s*=/gi, '')
  sanitized = sanitized.replace(/data:text\/html/gi, '')
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')
  
  return sanitized.trim()
}

/**
 * Advanced validation rules
 */
export const ValidationRules = {
  email: (value: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format')
    }
    return value.toLowerCase().trim()
  },

  phone: (value: string): string => {
    // Indian phone number: 10 digits starting with 6-9
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length !== 10 || !/^[6-9]/.test(cleaned)) {
      throw new Error('Phone must be 10 digits starting with 6-9')
    }
    return cleaned
  },

  price: (value: number): number => {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('Price must be a valid number')
    }
    if (value < 0 || value > 999999999999) {
      throw new Error('Price must be between 0 and 999999999999')
    }
    return Math.round(value * 100) / 100 // Round to 2 decimal places
  },

  text: (value: string, maxLength = 1000): string => {
    const sanitized = sanitizeInput(value)
    if (sanitized.length > maxLength) {
      throw new Error(`Text exceeds maximum length of ${maxLength}`)
    }
    return sanitized
  },

  url: (value: string): string => {
    try {
      const url = new URL(value)
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('URL must use http or https protocol')
      }
      return url.toString()
    } catch {
      throw new Error('Invalid URL format')
    }
  },

  slug: (value: string): string => {
    if (!/^[a-z0-9-]+$/.test(value)) {
      throw new Error('Slug can only contain lowercase letters, numbers, and hyphens')
    }
    if (value.length < 2 || value.length > 100) {
      throw new Error('Slug must be between 2 and 100 characters')
    }
    return value
  },

  alphanumeric: (value: string): string => {
    if (!/^[a-zA-Z0-9]+$/.test(value)) {
      throw new Error('Must contain only letters and numbers')
    }
    return value
  },

  uuid: (value: string): string => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(value)) {
      throw new Error('Invalid UUID format')
    }
    return value.toLowerCase()
  },

  password: (value: string): string => {
    if (value.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }
    if (value.length > 128) {
      throw new Error('Password must be less than 128 characters')
    }
    // Check for at least one uppercase, one lowercase, one number
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    }
    return value
  }
}

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }
  
  // Remove potentially dangerous tags
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
}

