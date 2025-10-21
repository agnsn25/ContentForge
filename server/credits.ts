import type { TargetFormat } from "@shared/schema";

/**
 * Credit calculation utility for ContentHammer
 * 
 * Pricing model:
 * - 1 credit = 1,000 tokens of total usage (input + output)
 * - Base costs vary by format based on typical output lengths
 * - All estimates include 15% safety buffer to protect margins from Grok variance
 * - Users are charged the ESTIMATE amount (fixed price), not actual usage
 */

// Estimated output tokens by format (with 15% safety buffer)
const FORMAT_OUTPUT_TOKENS: Record<TargetFormat, number> = {
  newsletter: 805,   // Base: 700 tokens → 805 with 15% buffer
  social: 805,       // Base: 700 tokens → 805 with 15% buffer
  blog: 1610,        // Base: 1400 tokens → 1610 with 15% buffer
  x: 575,            // Base: 500 tokens → 575 with 15% buffer
};

// System prompt overhead tokens by format (exact known values, no padding needed)
const FORMAT_SYSTEM_TOKENS: Record<TargetFormat, number> = {
  newsletter: 500,   // Known exact value for our system prompts
  social: 500,
  blog: 500,
  x: 500,
};

// LLMO adds extra tokens
const LLMO_EXTRA_OUTPUT_TOKENS = 1380;  // AI-generated metadata: Base 1200 → 1380 with 15% buffer
const LLMO_EXTRA_SYSTEM_TOKENS = 500;   // Known system prompt (exact value, no padding)

// Writing style matching adds user samples to input (base estimate for typical samples)
const STYLE_MATCHING_EXTRA_TOKENS = 2100; // Base estimate for user writing samples

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
  
  // Step 1: Content Analysis
  const step1Tokens = transcriptTokens + 500 + 575; // transcript + system (known) + output (padded)
  const step1Credits = Math.ceil(step1Tokens / 1000);
  breakdown.push({
    step: 'Step 1',
    credits: step1Credits,
    description: 'Content Analysis',
  });
  
  // Step 2: Format Recommendations
  const step2Tokens = transcriptTokens + 500 + 460; // system (known) + output (padded)
  const step2Credits = Math.ceil(step2Tokens / 1000);
  breakdown.push({
    step: 'Step 2',
    credits: step2Credits,
    description: 'Format Recommendations',
  });
  
  // Step 3: Title Generation
  const step3OutputTokens = selectedFormats.length * 345; // 300 → 345 per format with 15% buffer
  const step3Tokens = transcriptTokens + 500 + step3OutputTokens; // system (known) + output (padded)
  const step3Credits = Math.ceil(step3Tokens / 1000);
  breakdown.push({
    step: 'Step 3',
    credits: step3Credits,
    description: 'Title Generation',
  });
  
  // Step 4: Content Generation (full transformation for each format, includes 15% buffer)
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
  
  // Step 5: Publishing Calendar
  const step5Tokens = transcriptTokens + 500 + 690; // system (known) + output (padded)
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
