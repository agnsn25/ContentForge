import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
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
      const creditsRemaining = calculateCreditsRemaining(creditsUsed, creditsTotal);

      res.json({
        hasSubscription: true,
        subscription: {
          ...subscription,
          creditsRemaining,
        },
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post('/api/subscription/estimate', async (req, res) => {
    try {
      const { transcript, format, useStyleMatching, useLLMO, type, selectedFormats } = req.body;

      if (!transcript) {
        return res.status(400).json({ error: 'Transcript is required' });
      }

      if (type === 'strategy_generator') {
        const formats = selectedFormats || ['newsletter', 'social', 'blog'];
        const estimate = calculateStrategyGeneratorCredits(
          transcript,
          formats,
          useStyleMatching || false,
          useLLMO || false
        );
        return res.json(estimate);
      } else {
        // Quick transform
        if (!format) {
          return res.status(400).json({ error: 'Format is required for quick transform' });
        }
        const estimate = calculateQuickTransformCredits(
          transcript,
          format as TargetFormat,
          useStyleMatching || false,
          useLLMO || false
        );
        return res.json(estimate);
      }
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
  
  // Transform content endpoint (works for both authenticated and guest users)
  app.post('/api/transform', upload.single('file'), async (req: any, res) => {
    try {
      const { sourceType, targetFormat, url, useStyleMatching, useLLMO, model } = req.body;
      const file = req.file;

      if (!targetFormat || !['newsletter', 'social', 'blog', 'x'].includes(targetFormat)) {
        return res.status(400).json({ error: 'Invalid target format' });
      }

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

        // Calculate credits needed
        const { credits: creditsNeeded, transcriptTokens, estimatedOutputTokens, breakdown } = 
          calculateQuickTransformCredits(
            transcript,
            targetFormat as TargetFormat,
            useStyleMatching === 'true',
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
      const { sourceType, url, useStyleMatching, useLLMO } = req.body;
      const file = req.file;
      const userId = req.user?.claims?.sub || null;

      let transcript = '';
      let sourceUrl = '';
      let fileName = '';

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
