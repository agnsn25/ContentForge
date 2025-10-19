import { 
  type ContentJob, 
  type InsertContentJob,
  type User,
  type UpsertUser,
  type WritingSample,
  type InsertWritingSample,
  type StrategyJob,
  type InsertStrategyJob,
  contentJobs,
  users,
  writingSamples,
  strategyJobs
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Content job operations
  createContentJob(job: InsertContentJob): Promise<ContentJob>;
  getContentJob(id: string): Promise<ContentJob | undefined>;
  updateContentJob(id: string, updates: Partial<ContentJob>): Promise<ContentJob>;
  getUserContentJobs(userId: string): Promise<ContentJob[]>;
  
  // Writing sample operations
  createWritingSample(sample: InsertWritingSample): Promise<WritingSample>;
  getUserWritingSamples(userId: string): Promise<WritingSample[]>;
  deleteWritingSample(id: string): Promise<void>;
  
  // Strategy job operations
  createStrategyJob(job: InsertStrategyJob): Promise<StrategyJob>;
  getStrategyJob(id: string): Promise<StrategyJob | undefined>;
  updateStrategyJob(id: string, updates: Partial<StrategyJob>): Promise<StrategyJob>;
  getUserStrategyJobs(userId: string): Promise<StrategyJob[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Content job operations
  async createContentJob(insertJob: InsertContentJob): Promise<ContentJob> {
    const id = randomUUID();
    const [job] = await db
      .insert(contentJobs)
      .values({
        id,
        ...insertJob,
      })
      .returning();
    return job;
  }

  async getContentJob(id: string): Promise<ContentJob | undefined> {
    const [job] = await db
      .select()
      .from(contentJobs)
      .where(eq(contentJobs.id, id));
    return job;
  }

  async updateContentJob(id: string, updates: Partial<ContentJob>): Promise<ContentJob> {
    const [job] = await db
      .update(contentJobs)
      .set(updates)
      .where(eq(contentJobs.id, id))
      .returning();
    
    if (!job) {
      throw new Error('Job not found');
    }
    
    return job;
  }

  async getUserContentJobs(userId: string): Promise<ContentJob[]> {
    return await db
      .select()
      .from(contentJobs)
      .where(eq(contentJobs.userId, userId))
      .orderBy(desc(contentJobs.createdAt));
  }

  // Writing sample operations
  async createWritingSample(insertSample: InsertWritingSample): Promise<WritingSample> {
    const id = randomUUID();
    const [sample] = await db
      .insert(writingSamples)
      .values({
        id,
        ...insertSample,
      })
      .returning();
    return sample;
  }

  async getUserWritingSamples(userId: string): Promise<WritingSample[]> {
    return await db
      .select()
      .from(writingSamples)
      .where(eq(writingSamples.userId, userId))
      .orderBy(desc(writingSamples.createdAt));
  }

  async deleteWritingSample(id: string): Promise<void> {
    await db
      .delete(writingSamples)
      .where(eq(writingSamples.id, id));
  }

  // Strategy job operations
  async createStrategyJob(insertJob: InsertStrategyJob): Promise<StrategyJob> {
    const id = randomUUID();
    const [job] = await db
      .insert(strategyJobs)
      .values({
        id,
        ...insertJob,
      })
      .returning();
    return job;
  }

  async getStrategyJob(id: string): Promise<StrategyJob | undefined> {
    const [job] = await db
      .select()
      .from(strategyJobs)
      .where(eq(strategyJobs.id, id));
    return job;
  }

  async updateStrategyJob(id: string, updates: Partial<StrategyJob>): Promise<StrategyJob> {
    const [job] = await db
      .update(strategyJobs)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(strategyJobs.id, id))
      .returning();
    
    if (!job) {
      throw new Error('Strategy job not found');
    }
    
    return job;
  }

  async getUserStrategyJobs(userId: string): Promise<StrategyJob[]> {
    return await db
      .select()
      .from(strategyJobs)
      .where(eq(strategyJobs.userId, userId))
      .orderBy(desc(strategyJobs.createdAt));
  }
}

export const storage = new DatabaseStorage();
