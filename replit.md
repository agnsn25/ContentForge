# ContentForge - AI-Powered Content Repurposing Tool

## Overview
ContentForge is an AI-powered web application that transforms long-form content (podcasts, videos, YouTube links, Spotify podcasts) into targeted formats like newsletters, social media tutorials, and blog posts. Built with React, Express, PostgreSQL, Replit Auth, and Grok AI (xAI), the tool streamlines content repurposing for creators with user authentication and content history.

## Current State
**Status**: Full Featured Application ✅
- User authentication with Replit Auth (Google, GitHub, Email, X, Apple)
- PostgreSQL database for persistent storage
- Content history and saved transformations
- Fully functional content transformation pipeline
- Beautiful, responsive UI with dark mode support
- YouTube transcript extraction (using @danielxceron/youtube-transcript)
- Spotify link metadata support
- File upload for audio, video, and text files
- Real-time AI processing with progress indicators
- Export functionality (copy/download as Markdown)

## Recent Changes (October 17, 2025)

### Format-Specific Output Structures & X Thread Generator (Latest)
- **Added X/Twitter Thread Format**: New format option that generates 8-12 tweet threads with numbered tweets, hashtags, and CTAs
- **Unique Output Structures**: Each format now has its own specialized structure instead of generic sections:
  - **Newsletter**: Intro, sections with bullet points, Quick Takeaway box, Call to Action
  - **Blog Post**: Meta description, introduction, sections, conclusion with word count
  - **Social Tutorial**: Hook slide + numbered carousel slides (8-10 slides)
  - **X Thread**: Numbered tweets (e.g., 1/10, 2/10) with character limit and hashtags
- **Enhanced AI Prompts**: Updated all Grok AI system prompts with format-specific requirements (400-600 words for newsletter, 800-1200 for blog, etc.)
- **Improved ContentPreview**: Now renders format-specific layouts with proper styling for each output type
- **FormatSelector UI**: Updated to show 4 format cards with responsive grid layout

### Authentication & Database Update
- **Implemented Replit Auth**: Full user authentication with Google, GitHub, Email, X (Twitter), and Apple login
- **PostgreSQL Database**: Migrated from in-memory to PostgreSQL for persistent storage
- **User Profiles**: Users table with email, name, and profile image
- **Content History**: All transformations saved and linked to user accounts
- **Landing Page**: Beautiful landing page for logged-out users
- **History Page**: View and manage all saved transformations
- **Protected Routes**: Secure API endpoints for authenticated users
- **Guest Support**: Transformation works for both logged-in and guest users

### Bug Fixes
- **Fixed YouTube Transcript**: Replaced broken `youtube-transcript` with `@danielxceron/youtube-transcript`
- YouTube transcripts now extract correctly with timestamps

### Initial MVP (Earlier)
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
  - `FormatSelector.tsx` - Interactive format selection cards (Newsletter/Social/Blog/X Thread)
  - `ProcessingIndicator.tsx` - Beautiful progress bar with status updates
  - `ContentPreview.tsx` - Format-specific preview rendering with export controls
  - `ThemeToggle.tsx` - Light/dark mode switcher with persistence

- **Pages**:
  - `Landing.tsx` - Marketing page for logged-out users with feature showcase
  - `Home.tsx` - Main application page with user dropdown and content transformation
  - `History.tsx` - View all saved transformations with filtering and search

- **Hooks**:
  - `useAuth.ts` - Authentication hook for checking login status and user info

- **Styling**:
  - Tailwind CSS with custom design tokens
  - Dark mode support with class-based toggling
  - Indigo primary, emerald secondary, amber accent color scheme
  - Responsive design optimized for all screen sizes

### Backend (Express + TypeScript)
- **API Routes** (`server/routes.ts`):
  - `GET /api/login` - Initiate Replit Auth login flow
  - `GET /api/logout` - Logout and clear session
  - `GET /api/callback` - OAuth callback handler
  - `GET /api/auth/user` - Get current user info (protected)
  - `GET /api/content/history` - Get user's transformation history (protected)
  - `POST /api/transform` - Upload file or submit link, start transformation (works for guests too)
  - `GET /api/job/:id` - Poll job status and retrieve results

- **Services**:
  - `replitAuth.ts` - Replit Auth/OpenID Connect integration with session management
  - `grok.ts` - Grok AI integration for content transformation
  - `transcript.ts` - YouTube/Spotify transcript extraction (fixed with @danielxceron/youtube-transcript)
  - `storage.ts` - PostgreSQL database operations (DatabaseStorage)
  - `db.ts` - Drizzle ORM database connection

- **AI Integration**:
  - Uses xAI Grok API (grok-2-1212 model) with 131K token context
  - Format-specific system prompts for Newsletter, Social Tutorial, Blog Post, and X Thread
  - Unique JSON-structured responses tailored to each format
  - Word count requirements: 400-600 for newsletter, 800-1200 for blog
  - Character limits: 280 chars per tweet, per slide for social

### Data Schema (`shared/schema.ts`)
```typescript
// User table (for Replit Auth)
User {
  id: string (varchar, primary key)
  email: string | null
  firstName: string | null
  lastName: string | null
  profileImageUrl: string | null
  createdAt: Date
  updatedAt: Date
}

// Sessions table (for Replit Auth)
Session {
  sid: string (primary key)
  sess: jsonb
  expire: timestamp
}

// Content jobs (linked to users)
ContentJob {
  id: string (varchar, primary key)
  userId: string | null (foreign key to users)
  sourceType: 'file' | 'youtube' | 'spotify'
  sourceUrl?: string
  fileName?: string
  transcript: string
  targetFormat: 'newsletter' | 'social' | 'blog' | 'x'
  transformedContent?: string
  status: 'processing' | 'completed' | 'error'
  error?: string
  createdAt: Date
}

// Format-specific output types
NewsletterContent {
  title, intro, sections[], quickTakeaway, callToAction, metadata
}
BlogContent {
  title, metaDescription, introduction, sections[], conclusion, metadata
}
SocialContent {
  hook, slides[], metadata
}
XThreadContent {
  tweets[], metadata
}
```

## Key Features

### Authentication
- **Replit Auth**: Secure OpenID Connect authentication
- **Login Methods**: Google, GitHub, Email/Password, X (Twitter), Apple
- **Session Management**: PostgreSQL-backed sessions with 7-day expiry
- **User Profiles**: Automatic user creation with email and profile picture
- **Protected Routes**: Middleware for securing API endpoints

### Content Input
- **File Upload**: Drag-and-drop for audio, video, text files (up to 100MB)
- **YouTube Links**: Automatic transcript extraction with timestamps (using @danielxceron/youtube-transcript)
- **Spotify Links**: Podcast metadata retrieval (note: full transcription requires external service)

### Content History
- **Saved Transformations**: All completed jobs saved to database
- **History Page**: View all past transformations with date, format, source
- **Quick Access**: Click to view any saved transformation
- **User-Specific**: Each user sees only their own content

### Transformation Formats
1. **Newsletter** (400-600 words): Brief intro, sections with bullet points, Quick Takeaway box, Call to Action
2. **Social Tutorial** (8-10 slides): Hook slide + carousel-style slides with emojis (max 280 chars per slide)
3. **Blog Post** (800-1200 words): Meta description, introduction, sections with transitions, conclusion
4. **X Thread** (8-12 tweets): Numbered tweets (1/10, 2/10...) with hashtags, max 280 chars per tweet

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
- `SESSION_SECRET` - Session secret for Express (auto-configured by Replit)
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)
- `REPL_ID` - Replit app ID for OAuth (auto-configured)
- `REPLIT_DOMAINS` - App domains for OAuth callbacks (auto-configured)
- `ISSUER_URL` - OAuth issuer URL (defaults to https://replit.com/oidc)

## Technical Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn UI, React Query, Wouter
- **Backend**: Express.js, Passport.js, OpenID Client, Multer, TypeScript
- **Database**: PostgreSQL (Neon), Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **AI**: xAI Grok (via OpenAI SDK)
- **Transcript Services**: @danielxceron/youtube-transcript, spotify-url-info

## Known Limitations
1. Audio/video files uploaded directly cannot be transcribed (would require Whisper AI integration)
2. Spotify podcasts return metadata only (full transcription needs external service)
3. Guest transformations are saved but not linked to users (one-time use)

## Future Enhancements
- Batch processing for multiple files
- Custom template creation
- Direct publishing integrations (Medium, LinkedIn, Twitter/X)
- Advanced AI features (tone adjustment, audience targeting)
- Audio/video transcription with Whisper AI
- Real-time collaboration features
- Content editing and refinement
- Team workspaces and sharing

## Development Guidelines
- Follow design_guidelines.md for all UI implementations
- Use Inter font family for all typography
- Maintain 2-4-6-8 spacing rhythm
- Keep animations subtle and purposeful
- Ensure all components are accessible with proper ARIA labels
- Use data-testid attributes for all interactive and display elements
