import { 
  type ContentJob, 
  type InsertContentJob,
  type User,
  type UpsertUser,
  type WritingSample,
  type InsertWritingSample,
  type StrategyJob,
  type InsertStrategyJob,
  type Subscription,
  type InsertSubscription,
  type CreditTransaction,
  type InsertCreditTransaction,
  type CreditPackage,
  type InsertCreditPackage,
  type CreditPurchase,
  type InsertCreditPurchase,
  contentJobs,
  users,
  writingSamples,
  strategyJobs,
  subscriptions,
  creditTransactions,
  creditPackages,
  creditPurchases
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

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
  
  // Subscription operations
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription>;
  deductCredits(userId: string, amount: number): Promise<Subscription>;
  addOneTimeCredits(userId: string, amount: number): Promise<Subscription>;
  
  // Credit transaction operations
  createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction>;
  getUserCreditTransactions(userId: string, limit?: number): Promise<CreditTransaction[]>;
  
  // Credit package operations
  getCreditPackages(): Promise<CreditPackage[]>;
  getActiveCreditPackages(): Promise<CreditPackage[]>;
  createCreditPackage(pkg: InsertCreditPackage): Promise<CreditPackage>;
  
  // Credit purchase operations
  createCreditPurchase(purchase: InsertCreditPurchase): Promise<CreditPurchase>;
  getUserCreditPurchases(userId: string): Promise<CreditPurchase[]>;
  updateCreditPurchaseStatus(id: string, status: string): Promise<CreditPurchase>;
  getPendingCreditPurchases(): Promise<CreditPurchase[]>;
  getCreditPurchase(id: string): Promise<CreditPurchase | undefined>;
  
  // Stripe operations
  updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
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

  // Subscription operations
  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    return subscription;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const [subscription] = await db
      .update(subscriptions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id))
      .returning();
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    return subscription;
  }

  async deductCredits(userId: string, amount: number): Promise<Subscription> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const oneTimeCredits = parseInt(subscription.oneTimeCredits);
    const creditsUsed = parseInt(subscription.creditsUsed);
    
    if (oneTimeCredits >= amount) {
      return await this.updateSubscription(subscription.id, {
        oneTimeCredits: (oneTimeCredits - amount).toString(),
      });
    } else {
      const remainingToDeduct = amount - oneTimeCredits;
      const newCreditsUsed = creditsUsed + remainingToDeduct;

      return await this.updateSubscription(subscription.id, {
        oneTimeCredits: '0',
        creditsUsed: newCreditsUsed.toString(),
      });
    }
  }

  async addOneTimeCredits(userId: string, amount: number): Promise<Subscription> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const currentOneTimeCredits = parseInt(subscription.oneTimeCredits);
    const newOneTimeCredits = currentOneTimeCredits + amount;

    return await this.updateSubscription(subscription.id, {
      oneTimeCredits: newOneTimeCredits.toString(),
    });
  }

  // Credit transaction operations
  async createCreditTransaction(insertTransaction: InsertCreditTransaction): Promise<CreditTransaction> {
    const [transaction] = await db
      .insert(creditTransactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async getUserCreditTransactions(userId: string, limit?: number): Promise<CreditTransaction[]> {
    let query = db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt));
    
    if (limit) {
      query = query.limit(limit) as any;
    }
    
    return await query;
  }

  async getCreditPackages(): Promise<CreditPackage[]> {
    return await db
      .select()
      .from(creditPackages)
      .orderBy(creditPackages.credits);
  }

  async getActiveCreditPackages(): Promise<CreditPackage[]> {
    return await db
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.isActive, 'true'))
      .orderBy(creditPackages.credits);
  }

  async createCreditPackage(insertPackage: InsertCreditPackage): Promise<CreditPackage> {
    const [pkg] = await db
      .insert(creditPackages)
      .values(insertPackage)
      .returning();
    return pkg;
  }

  async createCreditPurchase(insertPurchase: InsertCreditPurchase): Promise<CreditPurchase> {
    const [purchase] = await db
      .insert(creditPurchases)
      .values(insertPurchase)
      .returning();
    return purchase;
  }

  async getUserCreditPurchases(userId: string): Promise<CreditPurchase[]> {
    return await db
      .select()
      .from(creditPurchases)
      .where(eq(creditPurchases.userId, userId))
      .orderBy(desc(creditPurchases.createdAt));
  }

  async updateCreditPurchaseStatus(id: string, status: string): Promise<CreditPurchase> {
    const [purchase] = await db
      .update(creditPurchases)
      .set({ status })
      .where(eq(creditPurchases.id, id))
      .returning();
    
    if (!purchase) {
      throw new Error('Credit purchase not found');
    }
    
    return purchase;
  }

  async getPendingCreditPurchases(): Promise<CreditPurchase[]> {
    return await db
      .select()
      .from(creditPurchases)
      .where(eq(creditPurchases.status, 'pending'))
      .orderBy(desc(creditPurchases.createdAt));
  }

  async getCreditPurchase(id: string): Promise<CreditPurchase | undefined> {
    const [purchase] = await db
      .select()
      .from(creditPurchases)
      .where(eq(creditPurchases.id, id));
    return purchase;
  }

  async updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
}

export const storage = new DatabaseStorage();
