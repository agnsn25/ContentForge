import spotifyUrlInfo from 'spotify-url-info';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

const execFileAsync = promisify(execFile);

export async function getYoutubeTranscript(url: string): Promise<{ transcript: string; title: string }> {
  try {
    const videoId = extractYoutubeVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    console.log('Fetching YouTube transcript for:', url);

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yt-transcript-'));
    const outputTemplate = path.join(tmpDir, 'sub');

    try {
      // Get video title
      const { stdout: titleOut } = await execFileAsync('yt-dlp', [
        '--print', 'title',
        '--no-download',
        url,
      ], { timeout: 30000 });
      const title = titleOut.trim() || `YouTube Video (${videoId})`;

      // Download subtitles as json3
      await execFileAsync('yt-dlp', [
        '--write-auto-sub',
        '--write-sub',
        '--sub-lang', 'en',
        '--sub-format', 'json3',
        '--skip-download',
        '-o', outputTemplate,
        url,
      ], { timeout: 30000 });

      // Find the subtitle file (could be .en.json3)
      const files = await fs.readdir(tmpDir);
      const subFile = files.find(f => f.endsWith('.json3'));

      if (!subFile) {
        throw new Error('No captions available for this video.');
      }

      const jsonContent = await fs.readFile(path.join(tmpDir, subFile), 'utf-8');
      const json = JSON.parse(jsonContent);
      const events = json.events || [];

      const segments: Array<{ start: number; text: string }> = [];
      for (const event of events) {
        if (event.segs) {
          const text = event.segs.map((s: any) => s.utf8 || '').join('').trim();
          if (text && text !== '\n') {
            segments.push({ start: (event.tStartMs || 0) / 1000, text });
          }
        }
      }

      if (segments.length === 0) {
        throw new Error('Transcript was empty after parsing.');
      }

      const transcript = segments
        .map(seg => {
          const timestamp = formatTimestamp(seg.start);
          return `[${timestamp}] ${seg.text}`;
        })
        .join('\n');

      return { transcript, title };
    } finally {
      // Cleanup temp dir
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  } catch (error) {
    console.error('YouTube transcript error:', error);
    throw new Error(`Failed to fetch YouTube transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getSpotifyTranscript(url: string): Promise<{ transcript: string; title: string }> {
  try {
    const getData = spotifyUrlInfo(fetch);
    const data = await getData(url);
    
    // Spotify doesn't provide transcripts directly, so we'll return metadata
    // In a production app, you'd integrate with a transcription service
    const transcript = `Title: ${data.title || 'Unknown'}
Artist/Creator: ${(data as any).artist || (data as any).show || 'Unknown'}
Description: ${data.description || 'No description available'}

Note: This is a Spotify podcast/episode. To get the full transcript, the audio would need to be downloaded and transcribed using a service like Whisper AI. For this MVP, please upload the audio file directly or use a YouTube link instead.`;

    return {
      transcript,
      title: data.title || 'Spotify Content'
    };
  } catch (error) {
    console.error('Spotify transcript error:', error);
    throw new Error(`Failed to fetch Spotify data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const buffer = file.buffer;
  
  // For audio/video files, in production you'd use a transcription service
  if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
    return `[Audio/Video File: ${file.originalname}]

Note: This is an audio/video file. To get a transcript, this file would need to be processed with a transcription service like Whisper AI. For this MVP, please use a YouTube link with captions or upload a text file with the transcript instead.`;
  }
  
  // For PDF files, in production you'd use a PDF parsing library
  if (file.mimetype === 'application/pdf') {
    return `[PDF File: ${file.originalname}]

Note: This is a PDF file. To extract text from PDFs, this file would need to be processed with a PDF parsing library like pdf-parse. For this MVP, please copy and paste the text content from the PDF into a text file, or use a YouTube link with captions instead.`;
  }
  
  // For text files, convert to UTF-8
  const text = buffer.toString('utf-8');
  return text;
}

function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
