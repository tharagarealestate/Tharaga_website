// XSS protection utilities using DOMPurify

import DOMPurify from 'dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks
 * Safe for both server and client side
 */
export function sanitizeHtml(dirty: string, options?: DOMPurify.Config): string {
  // For Node.js environments, create a fake window object
  if (typeof window === 'undefined') {
    const { JSDOM } = require('jsdom')
    const window = new JSDOM('').window
    const purify = DOMPurify(window as any)
    return purify.sanitize(dirty, options)
  }
  
  // For browser environments, use DOMPurify directly
  return DOMPurify.sanitize(dirty, options)
}

/**
 * Sanitize markdown content
 */
export function sanitizeMarkdown(markdown: string): string {
  // First, sanitize HTML if any
  const clean = sanitizeHtml(markdown, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false
  })
  
  return clean
}

/**
 * Sanitize user input (name, email, etc.)
 */
export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return sanitizeHtml(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  })
}

/**
 * Sanitize URL to prevent javascript: and data: schemes
 */
export function sanitizeUrl(url: string): string {
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:']
  const lowerUrl = url.toLowerCase().trim()
  
  for (const scheme of dangerousSchemes) {
    if (lowerUrl.startsWith(scheme)) {
      return '#'
    }
  }
  
  return url
}

/**
 * Validate and sanitize JSON data
 */
export function sanitizeJson(data: any): any {
  if (typeof data === 'string') {
    return sanitizeInput(data)
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeJson(item))
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      const cleanKey = sanitizeInput(key)
      sanitized[cleanKey] = sanitizeJson(value)
    }
    return sanitized
  }
  
  return data
}

