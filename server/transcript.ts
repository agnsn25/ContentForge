import spotifyUrlInfo from 'spotify-url-info';

const INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

async function fetchVideoInfo(videoId: string): Promise<{ title: string; captionTracks: any[] }> {
  const playerRes = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: '19.09.37',
            hl: 'en',
          },
        },
        videoId,
      }),
    }
  );

  if (!playerRes.ok) {
    throw new Error(`YouTube API returned status ${playerRes.status}`);
  }

  const data = await playerRes.json();

  if (data?.playabilityStatus?.status !== 'OK') {
    const reason = data?.playabilityStatus?.reason || 'Video is unavailable';
    throw new Error(reason);
  }

  const title = data?.videoDetails?.title || `YouTube Video (${videoId})`;
  const captionTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!captionTracks || captionTracks.length === 0) {
    throw new Error('No captions available for this video.');
  }

  return { title, captionTracks };
}

function parseCaptionXml(xml: string): Array<{ start: number; text: string }> {
  const segments: Array<{ start: number; text: string }> = [];

  const pRegex = /<p\s+t="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let pMatch;

  while ((pMatch = pRegex.exec(xml)) !== null) {
    const startMs = parseInt(pMatch[1], 10);
    const innerContent = pMatch[2];

    const sTexts: string[] = [];
    const sRegex = /<s[^>]*>([^<]*)<\/s>/g;
    let sMatch;
    while ((sMatch = sRegex.exec(innerContent)) !== null) {
      if (sMatch[1]) sTexts.push(sMatch[1]);
    }

    let text = sTexts.length > 0
      ? sTexts.join('')
      : innerContent.replace(/<[^>]+>/g, '');

    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/\n/g, ' ')
      .trim();

    if (text) {
      segments.push({ start: startMs / 1000, text });
    }
  }

  if (segments.length === 0) {
    const textRegex = /<text start="([^"]*)" dur="[^"]*"[^>]*>([\s\S]*?)<\/text>/g;
    let textMatch;
    while ((textMatch = textRegex.exec(xml)) !== null) {
      const start = parseFloat(textMatch[1]);
      let text = textMatch[2]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/<[^>]+>/g, '')
        .replace(/\n/g, ' ')
        .trim();
      if (text) {
        segments.push({ start, text });
      }
    }
  }

  return segments;
}

export async function getYoutubeTranscript(url: string): Promise<{ transcript: string; title: string }> {
  try {
    const videoId = extractYoutubeVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    console.log('Fetching YouTube transcript for:', url);

    const { title, captionTracks } = await fetchVideoInfo(videoId);

    const englishTrack = captionTracks.find((t: any) => t.languageCode === 'en') ||
                         captionTracks.find((t: any) => t.languageCode?.startsWith('en')) ||
                         captionTracks[0];

    const captionRes = await fetch(englishTrack.baseUrl, {
      headers: { 'User-Agent': 'com.google.android.youtube/19.09.37' },
    });

    if (!captionRes.ok) {
      throw new Error(`Failed to fetch caption track: ${captionRes.status}`);
    }

    const captionXml = await captionRes.text();
    const segments = parseCaptionXml(captionXml);

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
