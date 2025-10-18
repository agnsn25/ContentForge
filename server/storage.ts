import { 
  type ContentJob, 
  type InsertContentJob,
  type User,
  type UpsertUser,
  type WritingSample,
  type InsertWritingSample,
  contentJobs,
  users,
  writingSamples
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
}

export const storage = new DatabaseStorage();
