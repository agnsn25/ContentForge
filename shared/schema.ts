import { pgTable, text, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contentJobs = pgTable("content_jobs", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id), // Link to user (nullable for guest users)
  sourceType: text("source_type").notNull(), // 'file' | 'youtube' | 'spotify'
  sourceUrl: text("source_url"),
  fileName: text("file_name"),
  transcript: text("transcript").notNull(),
  targetFormat: text("target_format").notNull(), // 'newsletter' | 'social' | 'blog'
  transformedContent: text("transformed_content"),
  useLLMO: text("use_llmo").default('false'), // 'true' | 'false' - LLMO optimization for blog posts
  status: text("status").notNull().default('processing'), // 'processing' | 'completed' | 'error'
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const writingSamples = pgTable("writing_samples", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  wordCount: text("word_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const strategyJobs = pgTable("strategy_jobs", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  sourceType: text("source_type").notNull(),
  sourceUrl: text("source_url"),
  fileName: text("file_name"),
  transcript: text("transcript").notNull(),
  useStyleMatching: text("use_style_matching").notNull().default('false'),
  useLLMO: text("use_llmo").default('false'), // 'true' | 'false' - LLMO optimization for blog posts
  currentStep: text("current_step").notNull().default('1'),
  step1Output: text("step1_output"),
  step2Output: text("step2_output"),
  step3Output: text("step3_output"),
  step4Output: text("step4_output"),
  step5Output: text("step5_output"),
  selectedFormats: text("selected_formats"),
  status: text("status").notNull().default('in_progress'),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContentJobSchema = createInsertSchema(contentJobs).omit({
  id: true,
  createdAt: true,
});

export type InsertContentJob = z.infer<typeof insertContentJobSchema>;
export type ContentJob = typeof contentJobs.$inferSelect;

export const insertWritingSampleSchema = createInsertSchema(writingSamples).omit({
  id: true,
  createdAt: true,
});

export type InsertWritingSample = z.infer<typeof insertWritingSampleSchema>;
export type WritingSample = typeof writingSamples.$inferSelect;

export const insertStrategyJobSchema = createInsertSchema(strategyJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStrategyJob = z.infer<typeof insertStrategyJobSchema>;
export type StrategyJob = typeof strategyJobs.$inferSelect;

// User types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Frontend-only types for UI state
export type SourceType = 'file' | 'youtube' | 'spotify';
export type TargetFormat = 'newsletter' | 'social' | 'blog' | 'x';
export type JobStatus = 'processing' | 'completed' | 'error';

// Format-specific output structures
export interface NewsletterContent {
  title: string;
  intro: string;
  sections: {
    heading: string;
    content: string;
    bulletPoints?: string[];
  }[];
  quickTakeaway: string;
  callToAction: string;
  metadata: {
    originalSource: string;
    transformedAt: string;
    format: 'newsletter';
    wordCount: number;
  };
}

export interface BlogContent {
  title: string;
  metaDescription: string;
  introduction: string;
  sections: {
    heading: string;
    content: string;
  }[];
  conclusion: string;
  llmo?: {
    keywords: string[];
    peopleAlsoAsk: {
      question: string;
      answer: string;
    }[];
    schemaMarkup: string;
    urlSlug: string;
    imageAltTexts: string[];
    seoScore: number;
    recommendations: string[];
  };
  metadata: {
    originalSource: string;
    transformedAt: string;
    format: 'blog';
    wordCount: number;
  };
}

export interface SocialContent {
  hook: string;
  slides: {
    slideNumber: number;
    content: string;
  }[];
  metadata: {
    originalSource: string;
    transformedAt: string;
    format: 'social';
    totalSlides: number;
  };
}

export interface XThreadContent {
  tweets: {
    tweetNumber: number;
    totalTweets: number;
    content: string;
  }[];
  metadata: {
    originalSource: string;
    transformedAt: string;
    format: 'x';
    totalTweets: number;
  };
}

export type TransformedContent = NewsletterContent | BlogContent | SocialContent | XThreadContent;

// Strategy-specific types
export interface Step1Analysis {
  topic: string;
  targetAudience: string;
  primaryGoals: string[];
  tone: string;
  keyTakeaways: string[];
}

export interface Step2Recommendation {
  format: TargetFormat;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedEngagement: string;
}

export interface Step3TitleOption {
  format: TargetFormat;
  titles: string[];
}

export interface Step4Content {
  format: TargetFormat;
  content: TransformedContent;
}

export interface Step5Schedule {
  contentPiece: {
    format: TargetFormat;
    title: string;
  };
  publishDate: string;
  publishTime: string;
  platform: string;
  promotionStrategy: string[];
}

// Subscription plans table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  plan: text("plan").notNull(), // 'starter' | 'pro'
  creditsTotal: text("credits_total").notNull(), // Total credits in plan per period
  creditsUsed: text("credits_used").notNull().default('0'), // Credits used this period
  billingPeriodStart: timestamp("billing_period_start").notNull(),
  billingPeriodEnd: timestamp("billing_period_end").notNull(),
  status: text("status").notNull().default('active'), // 'active' | 'cancelled' | 'expired'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Credit transactions table for logging all credit usage
export const creditTransactions = pgTable("credit_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id),
  jobId: varchar("job_id"), // Reference to contentJobs or strategyJobs
  jobType: text("job_type").notNull(), // 'quick_transform' | 'strategy_generator'
  format: text("format"), // Target format (nullable for strategy steps)
  creditsCharged: text("credits_charged").notNull(), // Amount of credits deducted
  transcriptTokens: text("transcript_tokens"), // Tokens in transcript
  outputTokens: text("output_tokens"), // Estimated output tokens
  features: jsonb("features"), // {useStyleMatching: boolean, useLLMO: boolean}
  description: text("description").notNull(), // Human-readable description
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;

// Plan types
export type PlanType = 'starter' | 'pro';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';
export type JobType = 'quick_transform' | 'strategy_generator';
