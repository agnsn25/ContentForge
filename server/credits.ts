import type { TargetFormat } from "@shared/schema";

/**
 * Credit calculation utility for ContentHammer
 * 
 * Pricing model:
 * - 1 credit = 1,000 tokens of total usage (input + output)
 * - Base costs vary by format based on typical output lengths
 * - Modifiers: +20% for style matching, +80% for LLMO optimization
 */

// Estimated output tokens by format
const FORMAT_OUTPUT_TOKENS: Record<TargetFormat, number> = {
  newsletter: 700,   // 400-600 words ≈ 500-800 tokens
  social: 700,       // 8-10 slides ≈ 600-800 tokens
  blog: 1400,        // 800-1200 words ≈ 1000-1600 tokens
  x: 500,            // 8-12 tweets ≈ 400-600 tokens
};

// System prompt overhead tokens by format
const FORMAT_SYSTEM_TOKENS: Record<TargetFormat, number> = {
  newsletter: 500,
  social: 500,
  blog: 500,
  x: 500,
};

// LLMO adds extra output tokens for metadata
const LLMO_EXTRA_OUTPUT_TOKENS = 1200;
const LLMO_EXTRA_SYSTEM_TOKENS = 500;

// Writing style matching adds user samples to input
const STYLE_MATCHING_EXTRA_TOKENS = 2100; // ~2 samples × 800 words

/**
 * Estimate transcript tokens from text
 * Rule of thumb: 1 token ≈ 4 characters
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate total tokens for a transformation
 */
export function calculateTotalTokens(
  transcriptTokens: number,
  format: TargetFormat,
  options: {
    useStyleMatching?: boolean;
    useLLMO?: boolean;
  } = {}
): {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
} {
  let inputTokens = transcriptTokens + FORMAT_SYSTEM_TOKENS[format];
  let outputTokens = FORMAT_OUTPUT_TOKENS[format];

  // Add style matching tokens to input
  if (options.useStyleMatching) {
    inputTokens += STYLE_MATCHING_EXTRA_TOKENS;
  }

  // Add LLMO tokens (both input prompt and output metadata)
  if (options.useLLMO && format === 'blog') {
    inputTokens += LLMO_EXTRA_SYSTEM_TOKENS;
    outputTokens += LLMO_EXTRA_OUTPUT_TOKENS;
  }

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}

/**
 * Calculate credits required for a transformation
 * 1 credit = 1,000 tokens
 */
export function calculateCredits(
  transcriptTokens: number,
  format: TargetFormat,
  options: {
    useStyleMatching?: boolean;
    useLLMO?: boolean;
  } = {}
): number {
  const { totalTokens } = calculateTotalTokens(transcriptTokens, format, options);
  
  // Convert tokens to credits (1 credit per 1K tokens)
  const credits = Math.ceil(totalTokens / 1000);
  
  return credits;
}

/**
 * Calculate credits for Quick Transform
 */
export function calculateQuickTransformCredits(
  transcript: string,
  format: TargetFormat,
  useStyleMatching: boolean = false,
  useLLMO: boolean = false
): {
  credits: number;
  transcriptTokens: number;
  estimatedOutputTokens: number;
  breakdown: string;
} {
  const transcriptTokens = estimateTokens(transcript);
  const credits = calculateCredits(transcriptTokens, format, { useStyleMatching, useLLMO });
  
  const { outputTokens } = calculateTotalTokens(transcriptTokens, format, { useStyleMatching, useLLMO });
  
  let breakdown = `${format} transformation`;
  if (useStyleMatching) breakdown += ' + style matching';
  if (useLLMO) breakdown += ' + LLMO optimization';
  
  return {
    credits,
    transcriptTokens,
    estimatedOutputTokens: outputTokens,
    breakdown,
  };
}

/**
 * Calculate credits for Strategy Generator
 * Strategy has 5 steps with varying costs
 */
export function calculateStrategyGeneratorCredits(
  transcript: string,
  selectedFormats: TargetFormat[],
  useStyleMatching: boolean = false,
  useLLMO: boolean = false
): {
  totalCredits: number;
  breakdown: {
    step: string;
    credits: number;
    description: string;
  }[];
} {
  const transcriptTokens = estimateTokens(transcript);
  const breakdown: { step: string; credits: number; description: string }[] = [];
  
  // Step 1: Content Analysis (~500 output tokens)
  const step1Tokens = transcriptTokens + 500 + 500; // transcript + system + output
  const step1Credits = Math.ceil(step1Tokens / 1000);
  breakdown.push({
    step: 'Step 1',
    credits: step1Credits,
    description: 'Content Analysis',
  });
  
  // Step 2: Format Recommendations (~400 output tokens for all 4 formats)
  const step2Tokens = transcriptTokens + 500 + 400;
  const step2Credits = Math.ceil(step2Tokens / 1000);
  breakdown.push({
    step: 'Step 2',
    credits: step2Credits,
    description: 'Format Recommendations',
  });
  
  // Step 3: Title Generation (~300 output tokens per format)
  const step3OutputTokens = selectedFormats.length * 300;
  const step3Tokens = transcriptTokens + 500 + step3OutputTokens;
  const step3Credits = Math.ceil(step3Tokens / 1000);
  breakdown.push({
    step: 'Step 3',
    credits: step3Credits,
    description: 'Title Generation',
  });
  
  // Step 4: Content Generation (full transformation for each format)
  let step4Credits = 0;
  selectedFormats.forEach(format => {
    const formatCredits = calculateCredits(transcriptTokens, format, { useStyleMatching, useLLMO });
    step4Credits += formatCredits;
  });
  breakdown.push({
    step: 'Step 4',
    credits: step4Credits,
    description: `Content Generation (${selectedFormats.length} formats)`,
  });
  
  // Step 5: Publishing Calendar (~600 output tokens)
  const step5Tokens = transcriptTokens + 500 + 600;
  const step5Credits = Math.ceil(step5Tokens / 1000);
  breakdown.push({
    step: 'Step 5',
    credits: step5Credits,
    description: 'Publishing Strategy',
  });
  
  const totalCredits = breakdown.reduce((sum, item) => sum + item.credits, 0);
  
  return {
    totalCredits,
    breakdown,
  };
}

/**
 * Get plan details
 */
export const PLAN_DETAILS = {
  starter: {
    name: 'Starter',
    price: 19,
    credits: 500,
    features: [
      'Quick Transform for all formats',
      'Strategy Generator',
      'Writing Style Matching',
      'Content History',
    ],
  },
  pro: {
    name: 'Pro',
    price: 49,
    credits: 1500,
    features: [
      'Everything in Starter',
      'LLMO/GEO Optimization',
      'Priority Support',
      'Advanced Analytics',
    ],
  },
} as const;

/**
 * Check if user has sufficient credits
 */
export function hasSufficientCredits(
  creditsUsed: number,
  creditsTotal: number,
  creditsRequired: number
): boolean {
  const creditsRemaining = creditsTotal - creditsUsed;
  return creditsRemaining >= creditsRequired;
}

/**
 * Calculate credits remaining
 */
export function calculateCreditsRemaining(
  creditsUsed: number,
  creditsTotal: number
): number {
  return Math.max(0, creditsTotal - creditsUsed);
}
