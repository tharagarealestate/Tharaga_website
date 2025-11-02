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
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '')
  
  // Remove potential SQL injection patterns
  sanitized = sanitized.replace(/['";\\]/g, '')
  
  // Remove potential XSS patterns
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '')
  sanitized = sanitized.replace(/javascript:/gi, '')
  sanitized = sanitized.replace(/on\w+\s*=/gi, '')
  
  return sanitized.trim()
}

