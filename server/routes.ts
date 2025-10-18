import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { transformContent } from "./grok";
import { getYoutubeTranscript, getSpotifyTranscript, extractTextFromFile } from "./transcript";
import type { TargetFormat } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";

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
  
  // Transform content endpoint (works for both authenticated and guest users)
  app.post('/api/transform', upload.single('file'), async (req: any, res) => {
    try {
      const { sourceType, targetFormat, url, useStyleMatching } = req.body;
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
        status: 'processing',
        error: null,
      });

      // Start async transformation (don't await)
      processTransformation(job.id, transcript, targetFormat as TargetFormat, sourceInfo, writingSamples)
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

  const httpServer = createServer(app);
  return httpServer;
}

async function processTransformation(
  jobId: string, 
  transcript: string, 
  targetFormat: TargetFormat,
  sourceInfo: string,
  writingSamples?: any[]
) {
  try {
    console.log('Processing transformation for job:', jobId);
    console.log('Transcript length being sent to Grok:', transcript.length);
    if (writingSamples && writingSamples.length > 0) {
      console.log('Using style matching with', writingSamples.length, 'writing sample(s)');
    }
    const transformedContent = await transformContent(transcript, targetFormat, sourceInfo, writingSamples);
    
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
