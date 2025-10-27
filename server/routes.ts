import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import Stripe from "stripe";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { transformContent } from "./grok";
import { getYoutubeTranscript, getSpotifyTranscript, extractTextFromFile } from "./transcript";
import { executeStep1, executeStep2, executeStep3, executeStep4, executeStep5 } from "./strategy";
import type { TargetFormat } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  calculateQuickTransformCredits, 
  calculateStrategyGeneratorCredits,
  calculateCreditsRemaining,
  PLAN_DETAILS 
} from "./credits";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
});

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user's content history
  app.get('/api/content/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobs = await storage.getUserContentJobs(userId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching content history:", error);
      res.status(500).json({ message: "Failed to fetch content history" });
    }
  });

  // Writing samples routes
  app.get('/api/writing-samples', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const samples = await storage.getUserWritingSamples(userId);
      res.json(samples);
    } catch (error) {
      console.error("Error fetching writing samples:", error);
      res.status(500).json({ message: "Failed to fetch writing samples" });
    }
  });

  app.post('/api/writing-samples', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, content } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      // Count words and enforce max 800 words
      const wordCount = content.trim().split(/\s+/).length;
      if (wordCount > 800) {
        return res.status(400).json({ error: 'Content exceeds 800 word limit' });
      }

      // Check if user already has 2 samples
      const existingSamples = await storage.getUserWritingSamples(userId);
      if (existingSamples.length >= 2) {
        return res.status(400).json({ error: 'Maximum 2 writing samples allowed. Please delete one first.' });
      }

      const sample = await storage.createWritingSample({
        userId,
        title,
        content,
        wordCount: wordCount.toString(),
      });

      res.json(sample);
    } catch (error) {
      console.error("Error creating writing sample:", error);
      res.status(500).json({ message: "Failed to create writing sample" });
    }
  });

  app.delete('/api/writing-samples/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteWritingSample(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting writing sample:", error);
      res.status(500).json({ message: "Failed to delete writing sample" });
    }
  });

  // Subscription and credits routes
  app.get('/api/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getUserSubscription(userId);
      
      if (!subscription) {
        return res.json({ 
          hasSubscription: false,
          message: 'No active subscription' 
        });
      }

      const creditsUsed = parseInt(subscription.creditsUsed);
      const creditsTotal = parseInt(subscription.creditsTotal);
      const oneTimeCredits = parseInt(subscription.oneTimeCredits);
      const subscriptionCreditsRemaining = calculateCreditsRemaining(creditsUsed, creditsTotal);
      const totalCreditsRemaining = subscriptionCreditsRemaining + oneTimeCredits;

      res.json({
        hasSubscription: true,
        subscription: {
          ...subscription,
          creditsRemaining: totalCreditsRemaining,
          subscriptionCreditsRemaining,
          oneTimeCreditsRemaining: oneTimeCredits,
        },
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post('/api/subscription/estimate', async (req: any, res) => {
    try {
      const { transcript, format, useStyleMatching, useLLMO, type, selectedFormats } = req.body;

      if (!transcript) {
        return res.status(400).json({ error: 'Transcript is required' });
      }

      // Fetch writing samples if style matching is enabled
      let writingSampleContents: string[] = [];
      if (useStyleMatching && req.user) {
        const userId = req.user.claims.sub;
        const samples = await storage.getUserWritingSamples(userId);
        writingSampleContents = samples.map(s => s.content);
      }

      let estimateResult;
      let creditsRequired;

      if (type === 'strategy_generator') {
        const formats = selectedFormats || ['newsletter', 'social', 'blog', 'x'];
        estimateResult = calculateStrategyGeneratorCredits(
          transcript,
          formats,
          writingSampleContents,
          useLLMO || false
        );
        creditsRequired = estimateResult.totalCredits;
      } else {
        // Quick transform
        if (!format) {
          return res.status(400).json({ error: 'Format is required for quick transform' });
        }
        estimateResult = calculateQuickTransformCredits(
          transcript,
          format as TargetFormat,
          writingSampleContents,
          useLLMO || false
        );
        creditsRequired = estimateResult.credits;
      }

      // Check if user has sufficient credits
      let hasSufficientCredits = true;
      let creditsRemaining = null;

      if (req.user) {
        const userId = req.user.claims.sub;
        const subscription = await storage.getUserSubscription(userId);
        
        if (subscription) {
          const creditsUsed = parseInt(subscription.creditsUsed);
          const creditsTotal = parseInt(subscription.creditsTotal);
          creditsRemaining = creditsTotal - creditsUsed;
          hasSufficientCredits = creditsRemaining >= creditsRequired;
        }
      }

      return res.json({
        ...estimateResult,
        hasSufficientCredits,
        creditsRemaining,
        creditsRequired,
      });
    } catch (error) {
      console.error("Error estimating credits:", error);
      res.status(500).json({ message: "Failed to estimate credits" });
    }
  });

  app.get('/api/credits/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = await storage.getUserCreditTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching credit transactions:", error);
      res.status(500).json({ message: "Failed to fetch credit transactions" });
    }
  });

  // Billing routes
  app.get('/api/billing/packages', async (_req, res) => {
    try {
      const packages = await storage.getActiveCreditPackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching credit packages:", error);
      res.status(500).json({ message: "Failed to fetch credit packages" });
    }
  });

  app.get('/api/billing/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const subscription = await storage.getUserSubscription(userId);
      const transactions = await storage.getUserCreditTransactions(userId, 10);
      const purchases = await storage.getUserCreditPurchases(userId);

      if (!subscription) {
        return res.json({
          hasSubscription: false,
          message: 'No active subscription',
        });
      }

      const creditsUsed = parseInt(subscription.creditsUsed);
      const creditsTotal = parseInt(subscription.creditsTotal);
      const oneTimeCredits = parseInt(subscription.oneTimeCredits);
      const subscriptionCreditsRemaining = calculateCreditsRemaining(creditsUsed, creditsTotal);
      const totalCreditsRemaining = subscriptionCreditsRemaining + oneTimeCredits;

      const planDetails = PLAN_DETAILS[subscription.plan as keyof typeof PLAN_DETAILS];

      res.json({
        subscription: {
          ...subscription,
          plan: subscription.plan,
          planDetails,
          creditsTotal,
          creditsUsed,
          subscriptionCreditsRemaining,
          oneTimeCreditsRemaining: oneTimeCredits,
          totalCreditsRemaining,
        },
        recentTransactions: transactions,
        creditPurchases: purchases,
      });
    } catch (error) {
      console.error("Error fetching billing dashboard:", error);
      res.status(500).json({ message: "Failed to fetch billing dashboard" });
    }
  });

  // Stripe routes - Subscription checkout (using Checkout Sessions)
  app.post('/api/stripe/create-subscription-checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { plan, priceId } = req.body;

      if (!plan || !priceId) {
        return res.status(400).json({ error: 'Plan and priceId are required' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user already has an active subscription
      const existingSubscription = await storage.getUserSubscription(userId);
      if (existingSubscription && existingSubscription.stripeSubscriptionId && existingSubscription.status === 'active') {
        return res.status(400).json({ 
          error: 'You already have an active subscription. Please use the update subscription endpoint to change your plan.',
          code: 'EXISTING_SUBSCRIPTION'
        });
      }

      let customerId = user.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: {
            userId: user.id,
          },
        });
        customerId = customer.id;
        await storage.updateUserStripeCustomerId(userId, customerId);
      }

      // Create Stripe Checkout Session for subscription
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : 'http://localhost:5000';
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${baseUrl}/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing`,
        metadata: {
          userId: user.id,
          plan: plan,
        },
      });

      res.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error: any) {
      console.error("Error creating subscription checkout:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe routes - Update existing subscription (plan switching)
  app.post('/api/stripe/update-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { plan, priceId } = req.body;

      if (!plan || !priceId) {
        return res.status(400).json({ error: 'Plan and priceId are required' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const existingSubscription = await storage.getUserSubscription(userId);
      if (!existingSubscription || !existingSubscription.stripeSubscriptionId) {
        return res.status(404).json({ error: 'No active subscription found' });
      }

      // Get the Stripe subscription
      const stripeSubscription = await stripe.subscriptions.retrieve(
        existingSubscription.stripeSubscriptionId
      );

      if (!stripeSubscription || stripeSubscription.status === 'canceled') {
        return res.status(400).json({ error: 'Subscription is not active' });
      }

      // Update the subscription to the new price
      const updatedSubscription = await stripe.subscriptions.update(
        existingSubscription.stripeSubscriptionId,
        {
          items: [{
            id: stripeSubscription.items.data[0].id,
            price: priceId,
          }],
          proration_behavior: 'always_invoice',
        }
      );

      // Update our database
      let newPlan: 'starter' | 'pro' = 'starter';
      let creditsTotal = '500';
      
      if (priceId === process.env.VITE_STRIPE_PRO_PRICE_ID) {
        newPlan = 'pro';
        creditsTotal = '1500';
      }

      await storage.updateSubscription(existingSubscription.id, {
        plan: newPlan,
        creditsTotal,
        stripePriceId: priceId,
      });

      res.json({
        success: true,
        subscription: updatedSubscription,
      });
    } catch (error: any) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe routes - Credit pack checkout
  app.post('/api/stripe/create-credit-pack-checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { packageId } = req.body;

      if (!packageId) {
        return res.status(400).json({ error: 'Package ID is required' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const packages = await storage.getCreditPackages();
      const selectedPackage = packages.find(p => p.id === packageId);

      if (!selectedPackage) {
        return res.status(404).json({ error: 'Package not found' });
      }

      let customerId = user.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: {
            userId: user.id,
          },
        });
        customerId = customer.id;
        await storage.updateUserStripeCustomerId(userId, customerId);
      }

      const amountInCents = Math.round(parseFloat(selectedPackage.priceUSD) * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        customer: customerId,
        metadata: {
          userId,
          packageId,
          credits: selectedPackage.credits,
          type: 'credit_pack_purchase',
        },
      });

      const purchase = await storage.createCreditPurchase({
        userId,
        packageId,
        credits: selectedPackage.credits,
        amountPaid: selectedPackage.priceUSD,
        paymentProvider: 'stripe',
        paymentId: paymentIntent.id,
        status: 'pending',
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        purchaseId: purchase.id,
      });
    } catch (error: any) {
      console.error("Error creating credit pack checkout:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe webhook for payment events
  // NOTE: req.body is a raw Buffer because of express.raw() middleware in server/index.ts
  app.post('/api/stripe/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).send('Webhook signature missing');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      console.log(`[WEBHOOK] Received event: ${event.type}`);
      
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log(`[WEBHOOK] Checkout session completed - mode: ${session.mode}, customer: ${session.customer}, subscription: ${session.subscription}`);
          
          // Handle subscription checkout completion
          if (session.mode === 'subscription' && session.subscription) {
            const subscriptionId = typeof session.subscription === 'string' 
              ? session.subscription 
              : session.subscription.id;
            
            console.log(`[WEBHOOK] Retrieving Stripe subscription: ${subscriptionId}`);
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const customerId = typeof subscription.customer === 'string' 
              ? subscription.customer 
              : subscription.customer.id;
            
            console.log(`[WEBHOOK] Looking up user with Stripe customer ID: ${customerId}`);
            const allUsers = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
            const user = allUsers[0];
            
            if (!user) {
              console.error(`[WEBHOOK] No user found with Stripe customer ID: ${customerId}`);
              return res.status(200).json({ received: true, error: 'User not found' });
            }
            
            console.log(`[WEBHOOK] Found user: ${user.id} (${user.email})`);
            
            const priceId = subscription.items.data[0]?.price.id;
            console.log(`[WEBHOOK] Subscription price ID: ${priceId}`);
            console.log(`[WEBHOOK] VITE_STRIPE_STARTER_PRICE_ID: ${process.env.VITE_STRIPE_STARTER_PRICE_ID}`);
            console.log(`[WEBHOOK] VITE_STRIPE_PRO_PRICE_ID: ${process.env.VITE_STRIPE_PRO_PRICE_ID}`);
            
            let plan: 'starter' | 'pro' = 'starter';
            let creditsTotal = '500';
            
            if (priceId === process.env.VITE_STRIPE_PRO_PRICE_ID) {
              plan = 'pro';
              creditsTotal = '1500';
            }
            
            console.log(`[WEBHOOK] Determined plan: ${plan}, credits: ${creditsTotal}`);
            
            const existingSubscription = await storage.getUserSubscription(user.id);
            console.log(`[WEBHOOK] Existing subscription:`, existingSubscription ? `ID ${existingSubscription.id}, plan ${existingSubscription.plan}` : 'none');
            
            if (existingSubscription) {
              // Update existing subscription
              console.log(`[WEBHOOK] Updating existing subscription ${existingSubscription.id}`);
              await storage.updateSubscription(existingSubscription.id, {
                plan,
                creditsTotal,
                stripeSubscriptionId: subscription.id,
                stripePriceId: priceId,
                status: 'active',
                billingPeriodStart: new Date(subscription.current_period_start * 1000),
                billingPeriodEnd: new Date(subscription.current_period_end * 1000),
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
              });
              console.log(`[WEBHOOK] Successfully updated subscription for user ${user.id}`);
            } else {
              // Create new subscription
              console.log(`[WEBHOOK] Creating new subscription for user ${user.id}`);
              await storage.createSubscription({
                userId: user.id,
                plan,
                creditsTotal,
                creditsUsed: '0',
                oneTimeCredits: '0',
                billingPeriodStart: new Date(subscription.current_period_start * 1000),
                billingPeriodEnd: new Date(subscription.current_period_end * 1000),
                status: 'active',
                stripeSubscriptionId: subscription.id,
                stripePriceId: priceId,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
              });
              console.log(`[WEBHOOK] Successfully created subscription for user ${user.id}`);
            }
          }
          break;
        }

        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          
          if (paymentIntent.metadata.type === 'credit_pack_purchase') {
            const { userId, credits } = paymentIntent.metadata;
            
            const purchases = await storage.getUserCreditPurchases(userId);
            const purchase = purchases.find(p => p.paymentId === paymentIntent.id);
            
            if (purchase && purchase.status === 'pending') {
              await storage.updateCreditPurchaseStatus(purchase.id, 'completed');
              await storage.addOneTimeCredits(userId, parseInt(credits));
            }
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          
          const subscriptionId = (invoice as any).subscription;
          if (subscriptionId && typeof subscriptionId === 'string') {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
            
            const allUsers = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
            const user = allUsers[0];
            
            if (user) {
              const priceId = subscription.items.data[0]?.price.id;
              let plan: 'starter' | 'pro' = 'starter';
              let creditsTotal = '500';
              
              if (priceId === process.env.VITE_STRIPE_PRO_PRICE_ID) {
                plan = 'pro';
                creditsTotal = '1500';
              }
              
              const existingSubscription = await storage.getUserSubscription(user.id);
              
              if (existingSubscription) {
                await storage.updateSubscription(existingSubscription.id, {
                  status: 'active',
                  stripeSubscriptionId: subscription.id,
                  stripePriceId: priceId,
                  billingPeriodStart: new Date((subscription as any).current_period_start * 1000),
                  billingPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                  stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                  creditsUsed: '0',
                });
              } else {
                await storage.createSubscription({
                  userId: user.id,
                  plan,
                  creditsTotal,
                  creditsUsed: '0',
                  oneTimeCredits: '0',
                  billingPeriodStart: new Date((subscription as any).current_period_start * 1000),
                  billingPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                  status: 'active',
                  stripeSubscriptionId: subscription.id,
                  stripePriceId: priceId,
                  stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                });
              }
              
              await storage.updateUserStripeInfo(user.id, customerId, subscription.id);
            }
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
          
          const allUsers = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
          const user = allUsers[0];
          
          if (user) {
            const existingSubscription = await storage.getUserSubscription(user.id);
            if (existingSubscription) {
              await storage.updateSubscription(existingSubscription.id, {
                status: 'cancelled',
              });
            }
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Admin endpoint to manually complete pending credit purchases
  app.post('/api/admin/complete-pending-purchases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get all pending purchases
      const pendingPurchases = await storage.getPendingCreditPurchases();
      
      if (pendingPurchases.length === 0) {
        return res.json({ 
          message: 'No pending purchases found',
          completed: 0 
        });
      }

      const completedPurchases = [];
      
      // Process each pending purchase
      for (const purchase of pendingPurchases) {
        try {
          // Mark purchase as completed
          await storage.updateCreditPurchaseStatus(purchase.id, 'completed');
          
          // Add credits to user account
          await storage.addOneTimeCredits(purchase.userId, parseInt(purchase.credits));
          
          completedPurchases.push({
            purchaseId: purchase.id,
            userId: purchase.userId,
            credits: purchase.credits,
            amount: purchase.amountPaid,
          });
        } catch (error) {
          console.error(`Failed to process purchase ${purchase.id}:`, error);
        }
      }

      res.json({
        message: `Successfully completed ${completedPurchases.length} pending purchases`,
        completed: completedPurchases.length,
        purchases: completedPurchases,
      });
    } catch (error: any) {
      console.error("Error completing pending purchases:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Extract transcript endpoint - extracts transcript without transformation for cost estimation
  app.post('/api/extract-transcript', upload.single('file'), async (req: any, res) => {
    try {
      const { sourceType, url } = req.body;
      const file = req.file;

      let transcript = '';
      let sourceUrl = '';
      let fileName = '';
      let sourceInfo = '';

      // Get transcript based on source type
      if (sourceType === 'file' && file) {
        transcript = await extractTextFromFile(file);
        fileName = file.originalname;
        sourceInfo = fileName;
      } else if (sourceType === 'youtube' && url) {
        const result = await getYoutubeTranscript(url);
        transcript = result.transcript;
        sourceUrl = url;
        sourceInfo = result.title;
      } else if (sourceType === 'spotify' && url) {
        const result = await getSpotifyTranscript(url);
        transcript = result.transcript;
        sourceUrl = url;
        sourceInfo = result.title;
      } else {
        return res.status(400).json({ error: 'Invalid source type or missing data' });
      }

      res.json({
        transcript,
        sourceUrl,
        fileName,
        sourceInfo,
      });
    } catch (error) {
      console.error("Error extracting transcript:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to extract transcript" });
    }
  });
  
  // Transform content endpoint (works for both authenticated and guest users)
  app.post('/api/transform', upload.single('file'), async (req: any, res) => {
    try {
      const { sourceType, targetFormat, url, useStyleMatching, useLLMO, model, transcript: preExtractedTranscript, sourceInfo: preExtractedSourceInfo } = req.body;
      const file = req.file;

      if (!targetFormat || !['newsletter', 'social', 'blog', 'x'].includes(targetFormat)) {
        return res.status(400).json({ error: 'Invalid target format' });
      }

      let transcript = '';
      let sourceUrl = '';
      let fileName = '';
      let sourceInfo = '';

      // If transcript is already provided (from extract-transcript), use it
      if (preExtractedTranscript) {
        transcript = preExtractedTranscript;
        sourceInfo = preExtractedSourceInfo || 'Pre-extracted content';
        sourceUrl = url || '';
        fileName = file?.originalname || '';
      } else {
        // Otherwise, extract transcript based on source type
        if (sourceType === 'file' && file) {
          transcript = await extractTextFromFile(file);
          fileName = file.originalname;
          sourceInfo = fileName;
        } else if (sourceType === 'youtube' && url) {
          console.log('Fetching YouTube transcript for:', url);
          const result = await getYoutubeTranscript(url);
          console.log('Transcript length:', result.transcript.length);
          console.log('First 200 chars:', result.transcript.substring(0, 200));
          transcript = result.transcript;
          sourceUrl = url;
          sourceInfo = result.title;
        } else if (sourceType === 'spotify' && url) {
          const result = await getSpotifyTranscript(url);
          transcript = result.transcript;
          sourceUrl = url;
          sourceInfo = result.title;
        } else {
          return res.status(400).json({ error: 'Invalid source type or missing data' });
        }
      }

      // Get userId if user is authenticated
      const userId = req.isAuthenticated() ? req.user.claims.sub : null;

      // Check credits if user is authenticated
      if (userId) {
        const subscription = await storage.getUserSubscription(userId);
        
        if (!subscription) {
          return res.status(403).json({ 
            error: 'No active subscription. Please subscribe to a plan to use this feature.',
            requiresSubscription: true 
          });
        }

        // Fetch writing samples if style matching is enabled
        let writingSampleContents: string[] = [];
        if (useStyleMatching === 'true') {
          const samples = await storage.getUserWritingSamples(userId);
          writingSampleContents = samples.map(s => s.content);
        }

        // Calculate credits needed
        const { credits: creditsNeeded, transcriptTokens, estimatedOutputTokens, breakdown } = 
          calculateQuickTransformCredits(
            transcript,
            targetFormat as TargetFormat,
            writingSampleContents,
            useLLMO === 'true'
          );

        // Check if user has sufficient credits
        const creditsUsed = parseInt(subscription.creditsUsed);
        const creditsTotal = parseInt(subscription.creditsTotal);
        const creditsRemaining = creditsTotal - creditsUsed;

        if (creditsRemaining < creditsNeeded) {
          return res.status(403).json({ 
            error: `Insufficient credits. You need ${creditsNeeded} credits but only have ${creditsRemaining} remaining.`,
            creditsNeeded,
            creditsRemaining,
            insufficientCredits: true
          });
        }

        // Deduct credits
        await storage.deductCredits(userId, creditsNeeded);

        // Log transaction
        await storage.createCreditTransaction({
          userId,
          subscriptionId: subscription.id,
          jobId: null, // Will be updated after job creation
          jobType: 'quick_transform',
          format: targetFormat,
          creditsCharged: creditsNeeded.toString(),
          transcriptTokens: transcriptTokens.toString(),
          outputTokens: estimatedOutputTokens.toString(),
          features: {
            useStyleMatching: useStyleMatching === 'true',
            useLLMO: useLLMO === 'true',
          },
          description: breakdown,
        });
      }

      // Get writing samples if style matching is enabled and user is authenticated
      let writingSamples = undefined;
      if (useStyleMatching === 'true' && userId) {
        writingSamples = await storage.getUserWritingSamples(userId);
      }

      // Create job in storage
      const job = await storage.createContentJob({
        userId,
        sourceType,
        sourceUrl: sourceUrl || null,
        fileName: fileName || null,
        transcript,
        targetFormat: targetFormat as TargetFormat,
        transformedContent: null,
        useLLMO: useLLMO === 'true' ? 'true' : 'false',
        status: 'processing',
        error: null,
      });

      // Start async transformation (don't await)
      const grokModel = model || 'grok-4-fast-reasoning';
      processTransformation(job.id, transcript, targetFormat as TargetFormat, sourceInfo, writingSamples, useLLMO === 'true', grokModel)
        .catch(err => console.error('Transformation error:', err));

      res.json({ jobId: job.id, status: 'processing' });
    } catch (error) {
      console.error('Transform endpoint error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to process content' 
      });
    }
  });

  // Get job status endpoint
  app.get('/api/job/:id', async (req, res) => {
    try {
      const job = await storage.getContentJob(req.params.id);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json(job);
    } catch (error) {
      console.error('Job status error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to fetch job status' 
      });
    }
  });

  // Strategy Generator Routes
  app.post('/api/strategy/start', upload.single('file'), async (req: any, res) => {
    try {
      const { sourceType, url, useStyleMatching, useLLMO, transcript: preExtractedTranscript, sourceInfo: preExtractedSourceInfo } = req.body;
      const file = req.file;
      const userId = req.user?.claims?.sub || null;

      let transcript = '';
      let sourceUrl = '';
      let fileName = '';

      // If transcript is already provided (from extract-transcript), use it
      if (preExtractedTranscript) {
        transcript = preExtractedTranscript;
        fileName = preExtractedSourceInfo || 'Pre-extracted content';
        sourceUrl = url || '';
      } else {
        // Otherwise, extract transcript based on source type
        if (sourceType === 'file' && file) {
          transcript = await extractTextFromFile(file);
          fileName = file.originalname;
        } else if (sourceType === 'youtube' && url) {
          const result = await getYoutubeTranscript(url);
          transcript = result.transcript;
          sourceUrl = url;
        } else if (sourceType === 'spotify' && url) {
          const result = await getSpotifyTranscript(url);
          transcript = result.transcript;
          sourceUrl = url;
        } else {
          return res.status(400).json({ error: 'Invalid source type or missing data' });
        }
      }

      const job = await storage.createStrategyJob({
        userId,
        sourceType,
        sourceUrl,
        fileName,
        transcript,
        useStyleMatching: useStyleMatching === 'true' ? 'true' : 'false',
        useLLMO: useLLMO === 'true' ? 'true' : 'false',
        currentStep: '1',
        step1Output: null,
        step2Output: null,
        step3Output: null,
        step4Output: null,
        step5Output: null,
        selectedFormats: null,
        status: 'in_progress',
        error: null,
      });

      res.json({ strategyId: job.id });
    } catch (error) {
      console.error('Strategy start error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to start strategy' 
      });
    }
  });

  app.post('/api/strategy/:id/step1', async (req, res) => {
    try {
      const job = await storage.getStrategyJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      const sourceInfo = job.fileName || job.sourceUrl || 'Unknown source';
      const result = await executeStep1(job.transcript, sourceInfo);

      await storage.updateStrategyJob(job.id, {
        step1Output: JSON.stringify(result),
        currentStep: '2',
      });

      res.json(result);
    } catch (error) {
      console.error('Step 1 error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to execute step 1' 
      });
    }
  });

  app.post('/api/strategy/:id/step2', async (req, res) => {
    try {
      const { step1Output } = req.body;
      const job = await storage.getStrategyJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      const result = await executeStep2(job.transcript, step1Output);

      await storage.updateStrategyJob(job.id, {
        step1Output: JSON.stringify(step1Output),
        step2Output: JSON.stringify(result),
        currentStep: '3',
      });

      res.json(result);
    } catch (error) {
      console.error('Step 2 error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to execute step 2' 
      });
    }
  });

  app.post('/api/strategy/:id/step3', async (req, res) => {
    try {
      const { step1Output, selectedFormats } = req.body;
      const job = await storage.getStrategyJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      const result = await executeStep3(job.transcript, step1Output, selectedFormats);

      await storage.updateStrategyJob(job.id, {
        step3Output: JSON.stringify(result),
        selectedFormats: JSON.stringify(selectedFormats),
        currentStep: '4',
      });

      res.json(result);
    } catch (error) {
      console.error('Step 3 error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to execute step 3' 
      });
    }
  });

  app.post('/api/strategy/:id/step4', async (req, res) => {
    try {
      const { selectedTitles } = req.body;
      const job = await storage.getStrategyJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      const selectedFormats = JSON.parse(job.selectedFormats || '[]');
      const sourceInfo = job.fileName || job.sourceUrl || 'Unknown source';
      
      // Check credits if user is authenticated
      if (job.userId) {
        const subscription = await storage.getUserSubscription(job.userId);
        
        if (!subscription) {
          return res.status(403).json({ 
            error: 'No active subscription. Please subscribe to a plan to use this feature.',
            requiresSubscription: true 
          });
        }

        // Fetch writing samples if style matching is enabled
        let writingSampleContents: string[] = [];
        if (job.useStyleMatching === 'true') {
          const samples = await storage.getUserWritingSamples(job.userId);
          writingSampleContents = samples.map(s => s.content);
        }

        // Calculate credits needed for the entire strategy
        const { totalCredits, breakdown } = calculateStrategyGeneratorCredits(
          job.transcript,
          selectedFormats,
          writingSampleContents,
          job.useLLMO === 'true'
        );

        // Check if user has sufficient credits
        const creditsUsed = parseInt(subscription.creditsUsed);
        const creditsTotal = parseInt(subscription.creditsTotal);
        const creditsRemaining = creditsTotal - creditsUsed;

        if (creditsRemaining < totalCredits) {
          return res.status(403).json({ 
            error: `Insufficient credits. You need ${totalCredits} credits but only have ${creditsRemaining} remaining.`,
            creditsNeeded: totalCredits,
            creditsRemaining,
            insufficientCredits: true
          });
        }

        // Deduct credits
        await storage.deductCredits(job.userId, totalCredits);

        // Log transaction
        await storage.createCreditTransaction({
          userId: job.userId,
          subscriptionId: subscription.id,
          jobId: job.id,
          jobType: 'strategy_generator',
          format: null, // Multiple formats
          creditsCharged: totalCredits.toString(),
          transcriptTokens: null, // Already tracked in calculation
          outputTokens: null,
          features: {
            useStyleMatching: job.useStyleMatching === 'true',
            useLLMO: job.useLLMO === 'true',
            selectedFormats,
          },
          description: `Strategy Generator (${selectedFormats.length} formats: ${selectedFormats.join(', ')})`,
        });
      }
      
      // Get writing samples if style matching is enabled
      let writingSamples = undefined;
      if (job.useStyleMatching === 'true' && job.userId) {
        writingSamples = await storage.getUserWritingSamples(job.userId);
      }
      
      const useLLMO = job.useLLMO === 'true';
      const result = await executeStep4(job.transcript, sourceInfo, selectedFormats, selectedTitles, writingSamples, useLLMO);

      await storage.updateStrategyJob(job.id, {
        step4Output: JSON.stringify(result),
        currentStep: '5',
      });

      res.json(result);
    } catch (error) {
      console.error('Step 4 error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to execute step 4' 
      });
    }
  });

  app.post('/api/strategy/:id/step5', async (req, res) => {
    try {
      const { step1Output, step4Output } = req.body;
      const job = await storage.getStrategyJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      const result = await executeStep5(step1Output, step4Output);

      await storage.updateStrategyJob(job.id, {
        step5Output: JSON.stringify(result),
        status: 'completed',
      });

      res.json(result);
    } catch (error) {
      console.error('Step 5 error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to execute step 5' 
      });
    }
  });

  // IMPORTANT: Specific routes must come BEFORE parameterized routes
  app.get('/api/strategy/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const strategies = await storage.getUserStrategyJobs(userId);
      res.json(strategies);
    } catch (error) {
      console.error("Error fetching strategy history:", error);
      res.status(500).json({ message: "Failed to fetch strategy history" });
    }
  });

  app.get('/api/strategy/:id', async (req, res) => {
    try {
      const job = await storage.getStrategyJob(req.params.id);
      
      if (!job) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      res.json(job);
    } catch (error) {
      console.error('Get strategy error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to fetch strategy' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function processTransformation(
  jobId: string, 
  transcript: string, 
  targetFormat: TargetFormat,
  sourceInfo: string,
  writingSamples?: any[],
  useLLMO?: boolean,
  model?: string
) {
  try {
    console.log('Processing transformation for job:', jobId);
    console.log('Transcript length being sent to Grok:', transcript.length);
    console.log('Using model:', model || 'grok-4-fast-reasoning');
    if (writingSamples && writingSamples.length > 0) {
      console.log('Using style matching with', writingSamples.length, 'writing sample(s)');
    }
    if (useLLMO && targetFormat === 'blog') {
      console.log('Using LLMO optimization for blog post');
    }
    const transformedContent = await transformContent(transcript, targetFormat, sourceInfo, writingSamples, useLLMO, model);
    
    await storage.updateContentJob(jobId, {
      transformedContent,
      status: 'completed',
    });
  } catch (error) {
    await storage.updateContentJob(jobId, {
      status: 'error',
      error: error instanceof Error ? error.message : 'Transformation failed',
    });
  }
}
