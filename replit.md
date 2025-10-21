# ContentHammer - AI-Powered Content Repurposing Tool

## Overview
ContentHammer is an AI-powered web application designed to transform long-form content (podcasts, videos, YouTube links, Spotify podcasts) into various targeted formats, including newsletters, social media tutorials, blog posts, and X (Twitter) threads. It aims to streamline content repurposing for creators by integrating user authentication, content history, and advanced AI capabilities like a multi-step content strategy generator and writing style matching. The project's ambition is to provide a comprehensive tool that simplifies content distribution across multiple platforms.

## User Preferences
- Clean, minimal design inspired by Notion
- Focus on content-first workflows
- Generous whitespace and clear visual hierarchy
- Smooth animations and transitions (200ms)
- Accessibility: All interactive elements have data-testid attributes

## System Architecture
ContentHammer is a full-stack application built with React and TypeScript for the frontend and Express.js with TypeScript for the backend. PostgreSQL serves as the primary database, integrated via Drizzle ORM. Authentication is handled by Replit Auth, providing secure OpenID Connect login methods.

**UI/UX Decisions:**
- **Design System:** Uses Tailwind CSS with a custom design token system.
- **Color Scheme:** Indigo primary (#6366F1), emerald secondary (#10B981), and amber accent (#F59E0B). Amber-based warning colors for copyright notices.
- **Theming:** Full dark mode support with class-based toggling.
- **Responsiveness:** Optimized for all screen sizes.
- **Navigation:** Consistent header across pages (Home, History, Writing Samples) with a simplified user dropdown for logout. Footer with ToS link on all pages.
- **Copyright UX:** Warning boxes with AlertTriangle icon in amber color scheme appear before upload zones. Upload functionality disabled until ToS acceptance checkbox is checked.

**Technical Implementations & Feature Specifications:**
- **User Authentication:** Replit Auth provides secure login via Google, GitHub, Email, X, and Apple, with PostgreSQL-backed session management.
- **Content Input:** Supports file uploads (audio, video, text), YouTube links (with transcript extraction), and Spotify links (for metadata).
- **Copyright Protection & Legal Compliance:**
    - **Terms of Service:** Comprehensive ToS page at `/terms` with enhanced legal protections including:
        - Explicit warranties that merely possessing content doesn't grant derivative work rights
        - Requirements for original copyright owner's explicit written permission
        - Anti-circumvention language prohibiting DRM/access control bypass
        - AI-generated content disclaimer for draft/informational purposes
        - "Defend, indemnify, and hold harmless" clause with duty to defend
        - Detailed Repeat Infringer Policy (2 valid DMCA notices in 12 months = account termination)
        - $100 USD liability cap to limit financial exposure
    - **Upload Warnings:** Prominent copyright notices displayed in both Quick Transform and Strategy Generator modes before content upload.
    - **ToS Acceptance:** Required checkbox acknowledgment that users own rights or have permission to transform content before upload zone is accessible.
    - **Footer Links:** ToS links available in footer across all pages (Home, History, Writing Samples, Landing) for easy access.
    - **Legal Framework:** Multi-layered protection with user warranties, liability disclaimers, indemnification, DMCA compliance, and repeat infringer termination policy.
- **Content Transformation:**
    - Uses xAI Grok (grok-4-fast-reasoning model) with 131K token context for AI processing.
    - **Multi-Step Content Strategy Generator:** A 5-step wizard guides users through creating a complete content marketing strategy, including analysis, format selection, title generation, content creation, and a publishing calendar. Users can optionally apply their writing style to all generated content.
    - **Writing Style Matching:** Users can upload up to two writing samples (max 800 words each) for the AI to analyze and mimic their tone, sentence structure, and vocabulary. This feature is optional and toggleable.
    - **Format-Specific Output Structures:** Each output format (Newsletter, Social Tutorial, Blog Post, X Thread) has a unique, detailed structure with specific word/character limits and content components.
- **Credit System & Billing:**
    - **Conversion Rate:** 1 credit = 1,000 tokens
    - **Fixed-Price Model:** Users are charged the quoted estimate (not actual Grok API usage) for predictable pricing
    - **Smart Padding Strategy:** Only AI-generated outputs include 15% safety buffer; known values (system prompts, user content, writing samples) use exact measured token counts
    - **Token Breakdown:**
        - Format outputs (padded): Newsletter/Social 805, Blog 1,610, X Thread 575
        - System prompts (exact): 500 tokens per format
        - LLMO output (padded): 1,380 tokens; LLMO system (exact): 500 tokens
        - Style matching: Exact measured tokens from user's writing samples (up to 2 samples, 800 words each)
        - Transcript: Exact measured tokens (1 token ≈ 4 characters)
        - Strategy Generator steps: Mix of exact system prompts (500) and padded AI outputs (575, 460, 345/format, 690)
    - **Hard Block:** No transformations allowed if insufficient credits; no override option
    - **Subscription Tiers:** Starter ($19/500 credits), Pro ($49/1,500 credits)
- **Content History:** All transformations are saved to the database and linked to user accounts, accessible via a dedicated history page.
- **Export Options:** Transformed content can be copied to the clipboard or downloaded as a Markdown file.

**System Design Choices:**
- **Frontend Framework:** React 18 with TypeScript for robust component-based development.
- **Backend Framework:** Express.js with TypeScript for a scalable API layer.
- **Database:** PostgreSQL for persistent storage, managed with Drizzle ORM.
- **AI Integration:** xAI Grok API, utilizing format-specific system prompts and JSON-structured responses.
- **Modularity:** Clear separation of concerns between frontend components, backend services, and AI integration logic.

## External Dependencies
- **Authentication:** Replit Auth (OpenID Connect)
- **AI:** xAI Grok (via OpenAI SDK for API interaction)
- **Database:** PostgreSQL (specifically Neon for cloud hosting)
- **ORM:** Drizzle ORM
- **Transcript Services:**
    - `@danielxceron/youtube-transcript` for YouTube video transcription.
    - `spotify-url-info` for Spotify podcast metadata retrieval.
- **File Upload Handling:** Multer (for backend file processing).
- **Frontend Libraries:** React Query, Wouter (for routing).
- **Styling Framework:** Tailwind CSS.