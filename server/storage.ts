import { 
  type ContentJob, 
  type InsertContentJob,
  type User,
  type UpsertUser,
  contentJobs,
  users
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
}

export const storage = new DatabaseStorage();
