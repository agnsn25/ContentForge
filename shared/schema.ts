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
