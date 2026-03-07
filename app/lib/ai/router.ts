/**
 * THARAGA AI ROUTER - Multi-Model Intelligence Layer
 *
 * Routes AI requests to the cheapest capable model:
 * Tier 1: Groq (Llama 3.2 70B) - FREE, 500+ tok/sec - simple tasks
 * Tier 2: Google Gemini Flash - FREE (1500 req/day) - content generation
 * Tier 3: Claude Sonnet - PAID (~$3/1M tok) - complex analysis
 *
 * All responses cached in Supabase for cost optimization.
 */

import { createClient } from '@supabase/supabase-js';

// --- Types ---

export type AIProvider = 'groq' | 'gemini' | 'claude' | 'openai';
export type TaskComplexity = 'simple' | 'medium' | 'complex';

export type AITaskType =
  | 'lead_scoring'
  | 'intent_classification'
  | 'content_generation'
  | 'property_description'
  | 'market_analysis'
  | 'chat_response'
  | 'translation'
  | 'summarization';

export interface AIRequest {
  task: AITaskType;
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  cacheTTL?: number; // seconds, default 3600
  forceProvider?: AIProvider; // override routing
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  cached: boolean;
  latencyMs: number;
  tokensUsed?: number;
}

// --- Task Complexity Classification ---

const TASK_COMPLEXITY_MAP: Record<AITaskType, TaskComplexity> = {
  lead_scoring: 'simple',
  intent_classification: 'simple',
  content_generation: 'medium',
  property_description: 'medium',
  translation: 'medium',
  summarization: 'medium',
  chat_response: 'medium',
  market_analysis: 'complex',
};

// --- Provider Routing ---

const COMPLEXITY_TO_PROVIDER: Record<TaskComplexity, AIProvider[]> = {
  simple: ['groq', 'gemini', 'claude'],    // Try free first
  medium: ['gemini', 'groq', 'claude'],    // Gemini best for content
  complex: ['claude', 'openai', 'gemini'], // Claude for deep analysis
};

// --- Cache Layer ---

function hashPrompt(task: string, prompt: string): string {
  let hash = 0;
  const str = `${task}:${prompt}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `ai_cache_${Math.abs(hash).toString(36)}`;
}

async function getCachedResponse(
  supabase: ReturnType<typeof createClient>,
  cacheKey: string
): Promise<AIResponse | null> {
  try {
    const { data } = await supabase
      .from('ai_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (data) {
      return {
        content: data.response,
        provider: data.provider,
        model: data.model,
        cached: true,
        latencyMs: 0,
      };
    }
  } catch {
    // Cache miss - continue
  }
  return null;
}

async function setCachedResponse(
  supabase: ReturnType<typeof createClient>,
  cacheKey: string,
  response: AIResponse,
  ttlSeconds: number
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    await supabase.from('ai_cache').upsert({
      cache_key: cacheKey,
      response: response.content,
      provider: response.provider,
      model: response.model,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Cache write failure is non-critical
  }
}

// --- Provider Implementations ---

async function callGroq(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
        { role: 'user', content: request.prompt },
      ],
      max_tokens: request.maxTokens || 1024,
      temperature: request.temperature || 0.7,
    }),
  });

  if (!response.ok) throw new Error(`Groq API error: ${response.status}`);

  const data = await response.json();

  return {
    content: data.choices[0]?.message?.content || '',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    cached: false,
    latencyMs: Date.now() - startTime,
    tokensUsed: data.usage?.total_tokens,
  };
}

async function callGemini(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: request.systemPrompt ? `${request.systemPrompt}\n\n${request.prompt}` : request.prompt }]
        }],
        generationConfig: {
          maxOutputTokens: request.maxTokens || 1024,
          temperature: request.temperature || 0.7,
        },
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

  const data = await response.json();

  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    cached: false,
    latencyMs: Date.now() - startTime,
    tokensUsed: data.usageMetadata?.totalTokenCount,
  };
}

async function callClaude(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: request.maxTokens || 1024,
      ...(request.systemPrompt ? { system: request.systemPrompt } : {}),
      messages: [{ role: 'user', content: request.prompt }],
    }),
  });

  if (!response.ok) throw new Error(`Claude API error: ${response.status}`);

  const data = await response.json();

  return {
    content: data.content?.[0]?.text || '',
    provider: 'claude',
    model: 'claude-sonnet-4-20250514',
    cached: false,
    latencyMs: Date.now() - startTime,
    tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
  };
}

const PROVIDER_FUNCTIONS: Record<AIProvider, (req: AIRequest) => Promise<AIResponse>> = {
  groq: callGroq,
  gemini: callGemini,
  claude: callClaude,
  openai: callClaude, // Fallback to Claude if OpenAI requested
};

// --- Main Router ---

export async function routeAIRequest(
  request: AIRequest,
  supabaseUrl?: string,
  supabaseKey?: string
): Promise<AIResponse> {
  // 1. Check cache
  const cacheKey = hashPrompt(request.task, request.prompt);

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const cached = await getCachedResponse(supabase, cacheKey);
    if (cached) return cached;
  }

  // 2. Determine routing
  const complexity = TASK_COMPLEXITY_MAP[request.task] || 'medium';
  const providers = request.forceProvider
    ? [request.forceProvider]
    : COMPLEXITY_TO_PROVIDER[complexity];

  // 3. Try providers in order (fallback chain)
  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      const providerFn = PROVIDER_FUNCTIONS[provider];
      if (!providerFn) continue;

      const response = await providerFn(request);

      // 4. Cache successful response
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await setCachedResponse(supabase, cacheKey, response, request.cacheTTL || 3600);
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      console.warn(`AI provider ${provider} failed, trying next:`, (error as Error).message);
      continue;
    }
  }

  throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
}

// --- Convenience Functions ---

export async function scoreLeadAI(leadData: Record<string, unknown>): Promise<AIResponse> {
  return routeAIRequest({
    task: 'lead_scoring',
    systemPrompt: `You are a real estate lead scoring AI for the Indian market. Score leads 0-100 based on: budget clarity, timeline urgency, location specificity, engagement level, and contact completeness. Return JSON: {"score": number, "tier": "hot"|"warm"|"cold", "reasoning": string, "nextAction": string}`,
    prompt: JSON.stringify(leadData),
    maxTokens: 256,
    cacheTTL: 1800,
  },
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function generatePropertyDescription(propertyData: Record<string, unknown>): Promise<AIResponse> {
  return routeAIRequest({
    task: 'property_description',
    systemPrompt: `You are a premium real estate copywriter for the Indian market. Generate compelling property descriptions in English. Include key highlights, lifestyle benefits, and location advantages. Keep it under 200 words. Make it professional yet warm.`,
    prompt: JSON.stringify(propertyData),
    maxTokens: 512,
    cacheTTL: 86400,
  },
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function analyzeMarket(query: string): Promise<AIResponse> {
  return routeAIRequest({
    task: 'market_analysis',
    systemPrompt: `You are a Chennai real estate market analyst AI. Provide data-driven insights about property markets, price trends, RERA compliance, and investment potential. Focus on actionable intelligence for builders and buyers. Be specific about Chennai localities.`,
    prompt: query,
    maxTokens: 2048,
    cacheTTL: 7200,
  },
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function chatAI(message: string, context?: string): Promise<AIResponse> {
  return routeAIRequest({
    task: 'chat_response',
    systemPrompt: `You are Tharaga AI, a helpful real estate assistant specializing in Chennai and Tamil Nadu properties. You help buyers find properties and builders manage their business. Be concise, friendly, and knowledgeable about Indian real estate.${context ? `\n\nContext: ${context}` : ''}`,
    prompt: message,
    maxTokens: 1024,
    cacheTTL: 0, // Don't cache chat
  },
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY);
}
