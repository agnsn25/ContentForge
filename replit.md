# ContentForge - AI-Powered Content Repurposing Tool

## Overview
ContentForge is an AI-powered web application that transforms long-form content (podcasts, videos, YouTube links, Spotify podcasts) into targeted formats like newsletters, social media tutorials, and blog posts. Built with React, Express, and Grok AI (xAI), the tool streamlines content repurposing for creators.

## Current State
**Status**: MVP Complete ✅
- Fully functional content transformation pipeline
- Beautiful, responsive UI with dark mode support
- YouTube and Spotify link support with transcript extraction
- File upload for audio, video, and text files
- Real-time AI processing with progress indicators
- Export functionality (copy/download as Markdown)

## Recent Changes (October 17, 2025)
- Implemented complete frontend with Notion-inspired document interface
- Configured design system with indigo primary (#6366F1), emerald secondary (#10B981), and amber accent (#F59E0B)
- Built all React components: UploadZone, FormatSelector, ProcessingIndicator, ContentPreview
- Integrated Grok AI for content transformation into 3 formats
- Added YouTube transcript extraction with timestamps
- Implemented Spotify podcast metadata retrieval
- Created file upload handling with multer
- Added real-time job status polling and progress tracking

## Project Architecture

### Frontend (React + TypeScript)
- **Components**:
  - `UploadZone.tsx` - Drag-and-drop file upload + link input with mode toggle
  - `FormatSelector.tsx` - Interactive format selection cards (Newsletter/Social/Blog)
  - `ProcessingIndicator.tsx` - Beautiful progress bar with status updates
  - `ContentPreview.tsx` - Document-style preview with timestamps and export controls
  - `ThemeToggle.tsx` - Light/dark mode switcher with persistence

- **Pages**:
  - `Home.tsx` - Main application page with complete workflow

- **Styling**:
  - Tailwind CSS with custom design tokens
  - Dark mode support with class-based toggling
  - Indigo primary, emerald secondary, amber accent color scheme
  - Responsive design optimized for all screen sizes

### Backend (Express + TypeScript)
- **API Routes** (`server/routes.ts`):
  - `POST /api/transform` - Upload file or submit link, start transformation
  - `GET /api/job/:id` - Poll job status and retrieve results

- **Services**:
  - `grok.ts` - Grok AI integration for content transformation
  - `transcript.ts` - YouTube/Spotify transcript extraction
  - `storage.ts` - In-memory job storage (MemStorage)

- **AI Integration**:
  - Uses xAI Grok API (grok-2-1212 model) with 131K token context
  - Format-specific system prompts for Newsletter, Social Tutorial, Blog Post
  - JSON-structured responses with title, sections, timestamps, metadata

### Data Schema (`shared/schema.ts`)
```typescript
ContentJob {
  id: string
  sourceType: 'file' | 'youtube' | 'spotify'
  sourceUrl?: string
  fileName?: string
  transcript: string
  targetFormat: 'newsletter' | 'social' | 'blog'
  transformedContent?: string
  status: 'processing' | 'completed' | 'error'
  error?: string
  createdAt: Date
}
```

## Key Features

### Content Input
- **File Upload**: Drag-and-drop for audio, video, text files (up to 100MB)
- **YouTube Links**: Automatic transcript extraction with timestamps
- **Spotify Links**: Podcast metadata retrieval (note: full transcription requires external service)

### Transformation Formats
1. **Newsletter**: Email-friendly format with key takeaways and sections
2. **Social Tutorial**: Step-by-step guide with timestamps for social media
3. **Blog Post**: Long-form article with SEO-friendly structure

### Export Options
- Copy to clipboard (Markdown format)
- Download as .md file
- Preserve timestamps and formatting

## User Preferences
- Clean, minimal design inspired by Notion
- Focus on content-first workflows
- Generous whitespace and clear visual hierarchy
- Smooth animations and transitions (200ms)
- Accessibility: All interactive elements have data-testid attributes

## Environment Variables
- `XAI_API_KEY` - xAI API key for Grok integration (configured in Replit Secrets)
- `SESSION_SECRET` - Session secret for Express (pre-configured)

## Technical Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn UI, React Query, Wouter
- **Backend**: Express.js, Multer, TypeScript
- **AI**: xAI Grok (via OpenAI SDK)
- **Transcript Services**: youtube-transcript, spotify-url-info
- **Storage**: In-memory (MemStorage) for MVP

## Known Limitations (MVP)
1. Audio/video files uploaded directly cannot be transcribed (would require Whisper AI integration)
2. Spotify podcasts return metadata only (full transcription needs external service)
3. In-memory storage (data lost on restart) - production would use PostgreSQL
4. No user authentication or content history (future phase)

## Future Enhancements
- User accounts with content history
- Batch processing for multiple files
- Custom template creation
- Direct publishing integrations (Medium, LinkedIn, Twitter/X)
- Advanced AI features (tone adjustment, audience targeting)
- PostgreSQL persistence
- Audio/video transcription with Whisper AI
- Real-time collaboration features

## Development Guidelines
- Follow design_guidelines.md for all UI implementations
- Use Inter font family for all typography
- Maintain 2-4-6-8 spacing rhythm
- Keep animations subtle and purposeful
- Ensure all components are accessible with proper ARIA labels
- Use data-testid attributes for all interactive and display elements
