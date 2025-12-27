/**
 * Anthropic Claude API Client
 */

import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required')
}

export const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})






