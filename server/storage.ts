import { type ContentJob, type InsertContentJob } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createContentJob(job: InsertContentJob): Promise<ContentJob>;
  getContentJob(id: string): Promise<ContentJob | undefined>;
  updateContentJob(id: string, updates: Partial<ContentJob>): Promise<ContentJob>;
}

export class MemStorage implements IStorage {
  private jobs: Map<string, ContentJob>;

  constructor() {
    this.jobs = new Map();
  }

  async createContentJob(insertJob: InsertContentJob): Promise<ContentJob> {
    const id = randomUUID();
    const job: ContentJob = {
      ...insertJob,
      id,
      createdAt: new Date(),
    };
    this.jobs.set(id, job);
    return job;
  }

  async getContentJob(id: string): Promise<ContentJob | undefined> {
    return this.jobs.get(id);
  }

  async updateContentJob(id: string, updates: Partial<ContentJob>): Promise<ContentJob> {
    const job = this.jobs.get(id);
    if (!job) {
      throw new Error('Job not found');
    }
    
    const updatedJob = { ...job, ...updates };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }
}

export const storage = new MemStorage();
