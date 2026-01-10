/**
 * OpenAI Documentation Service
 * Handles embeddings generation and AI-powered documentation features
 */

import OpenAI from 'openai';

// Lazy initialization to avoid build-time errors
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
}

/**
 * Generate embedding for text using OpenAI
 * Uses text-embedding-3-small model (1536 dimensions, cost-effective)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const openai = getOpenAIClient();
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.trim(),
    });

    return response.data[0].embedding;
  } catch (error: any) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  try {
    const openai = getOpenAIClient();
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts.map(t => t.trim()),
    });

    return response.data.map(item => item.embedding);
  } catch (error: any) {
    console.error('Error generating embeddings batch:', error);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
}

/**
 * Generate text for documentation using OpenAI
 */
export async function generateDocumentationText(
  prompt: string,
  context?: string,
  model: string = 'gpt-4o-mini'
): Promise<string> {
  try {
    const openai = getOpenAIClient();
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: context || 'You are a technical documentation writer. Write clear, concise, and helpful documentation.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('Error generating documentation text:', error);
    throw new Error(`Failed to generate text: ${error.message}`);
  }
}

/**
 * Generate feature recommendation reasoning using AI
 */
export async function generateRecommendationReason(
  userContext: {
    viewedFeatures: string[];
    completedTutorials: string[];
    userRole: string;
    userTier: string;
  },
  recommendedFeature: {
    featureKey: string;
    featureName: string;
    category: string;
  }
): Promise<{ reason: string; confidence: number }> {
  try {
    const openai = getOpenAIClient();
    
    const prompt = `Based on the user's activity and profile, explain why they should use this feature.

User Profile:
- Role: ${userContext.userRole}
- Tier: ${userContext.userTier}
- Viewed Features: ${userContext.viewedFeatures.join(', ') || 'None'}
- Completed Tutorials: ${userContext.completedTutorials.join(', ') || 'None'}

Recommended Feature:
- Name: ${recommendedFeature.featureName}
- Category: ${recommendedFeature.category}

Generate a concise, personalized reason (2-3 sentences) explaining why this feature would be valuable for this user. Also provide a confidence score (0-1) based on how well this matches the user's needs.

Return JSON: {"reason": "...", "confidence": 0.0-1.0}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a feature recommendation engine. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return {
      reason: result.reason || 'This feature might be useful for you.',
      confidence: Math.max(0, Math.min(1, result.confidence || 0.7)),
    };
  } catch (error: any) {
    console.error('Error generating recommendation reason:', error);
    return {
      reason: 'This feature complements your current workflow.',
      confidence: 0.7,
    };
  }
}






























