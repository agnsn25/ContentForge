import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const contentJobs = pgTable("content_jobs", {
  id: varchar("id").primaryKey(),
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

export const insertContentJobSchema = createInsertSchema(contentJobs).omit({
  id: true,
  createdAt: true,
});

export type InsertContentJob = z.infer<typeof insertContentJobSchema>;
export type ContentJob = typeof contentJobs.$inferSelect;

// Frontend-only types for UI state
export type SourceType = 'file' | 'youtube' | 'spotify';
export type TargetFormat = 'newsletter' | 'social' | 'blog';
export type JobStatus = 'processing' | 'completed' | 'error';

export interface TransformedContent {
  title: string;
  sections: {
    heading: string;
    content: string;
    timestamp?: string;
  }[];
  metadata?: {
    originalSource: string;
    transformedAt: string;
    format: TargetFormat;
  };
}
