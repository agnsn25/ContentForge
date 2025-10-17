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
  
  // Transform content endpoint (works for both authenticated and guest users)
  app.post('/api/transform', upload.single('file'), async (req: any, res) => {
    try {
      const { sourceType, targetFormat, url } = req.body;
      const file = req.file;

      if (!targetFormat || !['newsletter', 'social', 'blog'].includes(targetFormat)) {
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
      processTransformation(job.id, transcript, targetFormat as TargetFormat, sourceInfo)
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
  sourceInfo: string
) {
  try {
    console.log('Processing transformation for job:', jobId);
    console.log('Transcript length being sent to Grok:', transcript.length);
    const transformedContent = await transformContent(transcript, targetFormat, sourceInfo);
    
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
