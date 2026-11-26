/**
 * Anthropic Claude API Client
 * Lazy initialization to avoid build-time errors when API key is not set
 */

import Anthropic from '@anthropic-ai/sdk'

let anthropicClientInstance: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClientInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable is required')
    }
    anthropicClientInstance = new Anthropic({
      apiKey,
    })
  }
  return anthropicClientInstance
}

// Export a proxy for backward compatibility - lazily initializes on first access
export const anthropicClient = new Proxy({} as Anthropic, {
  get(_target, prop) {
    const client = getAnthropicClient()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})






