import { YoutubeTranscript } from '@danielxceron/youtube-transcript';
import spotifyUrlInfo from 'spotify-url-info';

export async function getYoutubeTranscript(url: string): Promise<{ transcript: string; title: string }> {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  console.log('Fetching YouTube transcript for:', url);
  
  // List of common languages to try in order
  const languagesToTry = ['en', 'en-US', 'en-GB', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'ko', 'zh', 'ru', 'ar', 'hi'];
  
  let lastError: Error | null = null;
  
  // Try without language first (uses default)
  try {
    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
    
    // Combine transcript with timestamps
    const transcript = transcriptData
      .map(item => {
        const timestamp = formatTimestamp(item.offset / 1000);
        return `[${timestamp}] ${item.text}`;
      })
      .join('\n');

    return {
      transcript,
      title: `YouTube Video (${videoId})`
    };
  } catch (error) {
    console.log('Default language failed, trying specific languages...');
    lastError = error as Error;
  }
  
  // If default failed, try specific languages
  for (const lang of languagesToTry) {
    try {
      console.log(`Trying language: ${lang}`);
      const transcriptData = await YoutubeTranscript.fetchTranscript(videoId, { lang });
      
      // Combine transcript with timestamps
      const transcript = transcriptData
        .map(item => {
          const timestamp = formatTimestamp(item.offset / 1000);
          return `[${timestamp}] ${item.text}`;
        })
        .join('\n');

      console.log(`✓ Successfully fetched transcript in ${lang}`);
      return {
        transcript,
        title: `YouTube Video (${videoId})`
      };
    } catch (error) {
      // Continue to next language
      continue;
    }
  }
  
  // All attempts failed
  console.error('YouTube transcript error after trying all languages:', lastError);
  
  // Check if this is a transcript disabled error
  if (lastError && lastError.message.includes('Transcript is disabled')) {
    throw new Error(`This YouTube video has captions/transcripts disabled by the creator. Please try a different video, or upload a text/audio file instead. (Video ID: ${videoId})`);
  }
  
  // Check if this is a transcript not available error
  if (lastError && (lastError.message.includes('Could not find') || lastError.message.includes('not available'))) {
    throw new Error(`No captions/transcripts found for this YouTube video in any supported language. Please ensure the video has captions enabled, or try a different video. (Video ID: ${videoId})`);
  }
  
  throw new Error(`Failed to fetch YouTube transcript: ${lastError ? lastError.message : 'Unknown error'}`);
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
  const text = buffer.toString('utf-8');
  
  // For audio/video files, in production you'd use a transcription service
  if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
    return `[Audio/Video File: ${file.originalname}]

Note: This is an audio/video file. To get a transcript, this file would need to be processed with a transcription service like Whisper AI. For this MVP, please use a YouTube link with captions or upload a text file with the transcript instead.`;
  }
  
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
