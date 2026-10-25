/**
 * AI Documentation Assistant Chat API
 * RAG (Retrieval Augmented Generation) powered chat for documentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { generateEmbedding } from '@/lib/services/openai-documentation-service';

export const runtime = 'nodejs';
export const maxDuration = 30;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      message,
      sessionId,
      contextFeatureKey,
      contextPageUrl,
      conversationHistory = []
    } = body;

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and sessionId are required' },
        { status: 400 }
      );
    }

    // Get user context (role, tier)
    // Try to get user role - if table doesn't exist, default to 'builder'
    let userRoleName = 'builder';
    try {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      if (userRole) userRoleName = userRole.role;
    } catch (e) {
      // Table might not exist, use default
    }

    // Get subscription tier (if available)
    // Default to 'free' if subscription table doesn't exist or no active subscription
    let userTier = 'free';
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_type, tier')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      if (subscription) {
        userTier = subscription.tier || subscription.plan_type || 'free';
      }
    } catch (e) {
      // Table might not exist, use default
    }

    // Generate embedding for user query
    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await generateEmbedding(message);
    } catch (embedError) {
      console.error('Error generating embedding:', embedError);
      // Continue without embedding, will use keyword search fallback
    }

    // Vector similarity search for relevant documentation
    let relevantDocs: any[] = [];
    if (queryEmbedding) {
      const { data: searchResults, error: searchError } = await supabase.rpc(
        'search_feature_documentation_embeddings',
        {
          query_embedding: `[${queryEmbedding.join(',')}]`,
          match_threshold: 0.7,
          match_count: 5,
          filter_tier: userTier === 'pro' ? null : 'free', // Show free docs to free users, all docs to pro
        }
      );

      if (!searchError && searchResults) {
        relevantDocs = searchResults;
      }
    }

    // If no vector results, do keyword search as fallback
    if (relevantDocs.length === 0) {
      const { data: keywordResults } = await supabase
        .from('feature_documentation')
        .select('feature_key, feature_name, short_description, full_description, category')
        .or(`short_description.ilike.%${message}%,full_description.ilike.%${message}%,feature_name.ilike.%${message}%`)
        .limit(5);

      relevantDocs = keywordResults || [];
    }

    // Build context from relevant documentation
    const contextDocs = relevantDocs
      .slice(0, 3)
      .map((doc: any) => {
        return `Feature: ${doc.feature_name}
Category: ${doc.category}
Description: ${doc.short_description}
Details: ${doc.full_description || doc.short_description}`;
      })
      .join('\n\n---\n\n');

    // Build system prompt with context
    const systemPrompt = `You are an AI documentation assistant for Tharaga, a real estate SaaS platform. You help builders understand and use features through documentation.

User Context:
- Role: ${userRoleName}
- Subscription Tier: ${userTier}
${contextFeatureKey ? `- Current Feature: ${contextFeatureKey}` : ''}
${contextPageUrl ? `- Current Page: ${contextPageUrl}` : ''}

Relevant Documentation:
${contextDocs || 'No specific documentation found for this query.'}

Instructions:
1. Answer questions based on the relevant documentation provided above
2. If the documentation doesn't contain the answer, say so honestly
3. Be concise and actionable (2-3 sentences max per response)
4. Use markdown formatting for better readability
5. If relevant, suggest related features from the documentation
6. For Pro features, mention that they require Tharaga Pro subscription

Always cite which feature/document you're referring to when possible.`;

    // Build messages for OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6).map((msg: ChatMessage) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    // Get OpenAI response
    let aiResponse = '';
    let usedModel = 'fallback';
    let totalTokens = 0;

    try {
      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      aiResponse = completion.choices[0]?.message?.content || '';
      usedModel = 'gpt-4o-mini';
      totalTokens = completion.usage?.total_tokens || 0;
    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError);
      // Fallback response
      aiResponse = `I'm here to help with Tharaga documentation. Based on your question about "${message}", I found ${relevantDocs.length} relevant feature(s). 

${relevantDocs.length > 0 
  ? `Here are the relevant features:\n${relevantDocs.map((d: any) => `- **${d.feature_name}**: ${d.short_description}`).join('\n')}\n\nYou can view detailed documentation for these features in the help section.`
  : 'For detailed documentation, please browse the feature documentation section or contact support.'}`;
    }

    // Save conversation to database
    const conversationMessages: ChatMessage[] = [
      ...conversationHistory,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() },
    ];

    await supabase
      .from('ai_documentation_conversations')
      .upsert({
        user_id: user.id,
        session_id: sessionId,
        context_feature_key: contextFeatureKey || null,
        context_page_url: contextPageUrl || null,
        context_user_role: userRoleName,
        context_user_tier: userTier,
        messages: conversationMessages,
        total_tokens: totalTokens,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,session_id',
        ignoreDuplicates: false,
      });

    // Return response with citations
    return NextResponse.json({
      success: true,
      response: aiResponse,
      model: usedModel,
      citations: relevantDocs.map((doc: any) => ({
        feature_key: doc.feature_key,
        feature_name: doc.feature_name,
        similarity: doc.similarity || null,
      })),
      relevant_features: relevantDocs.map((doc: any) => doc.feature_key),
    });
  } catch (error: any) {
    console.error('AI Documentation Chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}


