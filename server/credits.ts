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
    styleMatchingTokens?: number;  // Exact measured tokens from user writing samples
  } = {}
): {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
} {
  let inputTokens = transcriptTokens + FORMAT_SYSTEM_TOKENS[format];
  const outputTokens = FORMAT_OUTPUT_TOKENS[format];

  // Add style matching tokens to input (exact measured value from user samples)
  if (options.styleMatchingTokens) {
    inputTokens += options.styleMatchingTokens;
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
    styleMatchingTokens?: number;  // Exact measured tokens from user writing samples
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
  writingSamples: string[] = [],
): {
  credits: number;
  transcriptTokens: number;
  estimatedOutputTokens: number;
  breakdown: string;
} {
  const transcriptTokens = estimateTokens(transcript);

  // Measure actual writing sample tokens if provided
  const styleMatchingTokens = writingSamples.length > 0
    ? writingSamples.reduce((sum, sample) => sum + estimateTokens(sample), 0)
    : undefined;

  const credits = calculateCredits(transcriptTokens, format, { styleMatchingTokens });

  const { outputTokens } = calculateTotalTokens(transcriptTokens, format, { styleMatchingTokens });

  let breakdown = `${format} transformation`;
  if (styleMatchingTokens) breakdown += ' + style matching';

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
  writingSamples: string[] = [],
): {
  totalCredits: number;
  breakdown: {
    step: string;
    credits: number;
    description: string;
  }[];
} {
  const transcriptTokens = estimateTokens(transcript);
  
  // Measure actual writing sample tokens if provided
  const styleMatchingTokens = writingSamples.length > 0
    ? writingSamples.reduce((sum, sample) => sum + estimateTokens(sample), 0)
    : undefined;
  
  // Calculate total tokens for all steps (sum first, round once at the end)
  let totalTokens = 0;
  
  // Step 1: Content Analysis
  const step1Tokens = transcriptTokens + 500 + 575; // transcript + system (known) + output (padded)
  totalTokens += step1Tokens;
  
  // Step 2: Format Recommendations
  const step2Tokens = transcriptTokens + 500 + 460; // system (known) + output (padded)
  totalTokens += step2Tokens;
  
  // Step 3: Title Generation
  const step3OutputTokens = selectedFormats.length * 345; // 300 → 345 per format with 15% buffer
  const step3Tokens = transcriptTokens + 500 + step3OutputTokens; // system (known) + output (padded)
  totalTokens += step3Tokens;
  
  // Step 4: Content Generation (full transformation for each format, includes 15% buffer)
  let step4Tokens = 0;
  selectedFormats.forEach(format => {
    const { totalTokens: formatTokens } = calculateTotalTokens(transcriptTokens, format, { styleMatchingTokens });
    step4Tokens += formatTokens;
  });
  totalTokens += step4Tokens;
  
  // Step 5: Publishing Calendar
  const step5Tokens = transcriptTokens + 500 + 690; // system (known) + output (padded)
  totalTokens += step5Tokens;
  
  // Round once at the end (fairer pricing, no over-rounding)
  const totalCredits = Math.ceil(totalTokens / 1000);
  
  // Note: breakdown is no longer returned to frontend, but kept for internal logging if needed
  const breakdown: { step: string; credits: number; description: string }[] = [];
  
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
