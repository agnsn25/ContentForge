# ContentHammer

Transform your long-form content into engaging, targeted formats with AI-powered repurposing.

## Overview

ContentHammer is an AI-powered web application that transforms podcasts, videos, YouTube links, and Spotify content into various formats including newsletters, social media carousels, blog posts, and Twitter/X threads. Built with AI at its core, it streamlines content distribution for creators, marketers, and agencies.

## Key Features

### 🎯 Content Transformation
- **Multiple Input Sources**: Upload audio/video files (up to 100MB), paste YouTube links, or Spotify podcast URLs
- **Four Output Formats**:
  - **Newsletter**: Email-friendly format with sections and key takeaways (400-600 words)
  - **Social Tutorial**: Instagram/LinkedIn carousel with 8-10 slides for visual storytelling
  - **Blog Post**: SEO-optimized long-form articles (800-1200 words)
  - **X Thread**: Twitter/X threads with 8-12 bite-sized tweets

### ✨ Advanced AI Capabilities
- **Writing Style Matching**: Upload your own writing samples (up to 2 samples, 800 words each) to have AI mimic your unique voice
- **LLMO/GEO Optimization**: Optimize blog posts for Large Language Model Optimization and Generative Engine Optimization
  - Structured for AI citability (ChatGPT, Google AI Overviews, Gemini)
  - E-E-A-T signals for authority and trustworthiness
  - SEO score with actionable recommendations
  - JSON-LD Schema markup generation
  - People Also Ask questions with quotable answers

### 🗺️ Strategy Generator
A 5-step wizard that creates complete content marketing plans:
1. **Content Analysis**: Identifies topic, audience, goals, tone, and key takeaways
2. **Format Recommendations**: AI suggests which formats work best with priority levels
3. **Title Generation**: Creates compelling titles for each recommended format
4. **Content Creation**: Generates all content pieces simultaneously
5. **Publishing Calendar**: Creates a strategic 30-day distribution schedule

### 💳 Credit System
- **Token-Based Pricing**: 1 credit = 1,000 tokens
- **Fixed-Price Model**: Users pay the quoted estimate for predictable pricing
- **Smart Padding**: 15% safety buffer on AI-generated outputs only
- **Subscription Tiers**:
  - Starter: $19/month for 500 credits
  - Pro: $49/month for 1,500 credits
- **One-Time Credit Packs** (never expire):
  - Starter Pack: 100 credits for $10
  - Creator Pack: 500 credits for $40
  - Pro Pack: 1,000 credits for $75
  - Enterprise Pack: 3,000 credits for $180
- **Priority Usage**: One-time credits are used first, then subscription credits

### 📊 User Features
- **Content History**: All transformations are saved and accessible
- **Export Options**: Copy to clipboard or download as Markdown
- **Billing Dashboard**: Track credit usage, billing periods, and purchase history
- **Legal Compliance**: Comprehensive Terms of Service with copyright protections

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for routing
- **TanStack Query** (React Query v5) for data fetching and caching
- **Tailwind CSS** with shadcn/ui components
- **Vite** for build tooling
- **React Hook Form** with Zod validation

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** via Neon (Replit-managed)
- **Drizzle ORM** for database management
- **xAI Grok** (grok-4-fast-reasoning model) for AI transformations
- **Stripe** for payments and subscriptions
- **Replit Auth** (OpenID Connect) for authentication

### Key Integrations
- **Replit Auth**: Google, GitHub, Email, X, and Apple login options
- **Stripe**: Subscription management and one-time purchases
- **xAI Grok**: AI-powered content transformation
- **YouTube Transcript API**: Automatic transcript extraction
- **Spotify**: Podcast metadata extraction

## Setup Instructions

### Prerequisites
- Node.js (automatically managed by Replit)
- PostgreSQL database (use Replit's built-in database)

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Database (automatically provided by Replit)
DATABASE_URL=your_postgres_connection_string

# xAI Grok API
XAI_API_KEY=your_xai_api_key

# Stripe (for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
VITE_STRIPE_STARTER_PRICE_ID=your_stripe_starter_price_id
VITE_STRIPE_PRO_PRICE_ID=your_stripe_pro_price_id

# Session Secret
SESSION_SECRET=your_random_session_secret

# Replit Auth (automatically configured)
ISSUER_URL=your_replit_issuer_url
CLIENT_ID=your_replit_client_id
CLIENT_SECRET=your_replit_client_secret
```

### Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Database**:
   ```bash
   npm run db:push
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000` (or your Replit preview URL).

### Integration Setup

Use Replit's integration tools to configure:
- **Replit Auth** (`javascript_log_in_with_replit`): Follow the setup wizard
- **Stripe** (`javascript_stripe`): Add your Stripe keys
- **xAI** (`javascript_xai`): Add your xAI API key

## Usage Guide

### Quick Transform Mode

1. **Upload Content**: Drag & drop a file or paste a YouTube/Spotify URL
2. **Accept Terms**: Check the copyright compliance checkbox
3. **Select Format**: Choose Newsletter, Social, Blog, or X Thread
4. **Optional Enhancements**:
   - Enable "Match My Writing Style" (requires writing samples)
   - Enable "LLMO/GEO Optimization" (blog posts only)
5. **Review Cost**: See credit estimate before proceeding
6. **Transform**: Confirm and wait for AI processing
7. **Export**: Copy to clipboard or download as Markdown

### Strategy Generator Mode

1. **Upload Content**: Provide source material
2. **Step 1 - Analysis**: AI analyzes your content's topic, audience, and goals
3. **Step 2 - Format Selection**: Choose which formats to create from AI recommendations
4. **Step 3 - Titles**: AI generates compelling titles for each format
5. **Step 4 - Content Creation**: AI produces all content simultaneously
6. **Step 5 - Publishing Calendar**: Get a 30-day distribution schedule
7. **Export Strategy**: Download complete strategy as Markdown

### Writing Samples

Navigate to **Writing Samples** to:
- Add up to 2 writing samples (800 words max each)
- Title and save your samples
- Enable style matching during transformations

### Billing & Credits

Access the **Billing** page to:
- View total credits (subscription + purchased)
- Track monthly usage and billing periods
- Purchase one-time credit packs
- Review transaction history
- Manage subscriptions

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (routing)
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configurations
├── server/                # Backend Express application
│   ├── routes.ts          # API endpoints
│   ├── grok.ts            # AI transformation logic
│   ├── strategy.ts        # Strategy Generator implementation
│   ├── credits.ts         # Credit calculation system
│   ├── storage.ts         # Database interface
│   └── auth.ts            # Authentication middleware
├── shared/                # Shared TypeScript types
│   └── schema.ts          # Database schemas and types
└── db/                    # Database migrations (Drizzle)
```

## API Routes

### Authentication
- `GET /api/login` - Initiate login flow
- `GET /api/logout` - Log out user
- `GET /api/user` - Get current user info

### Content Transformation
- `POST /api/extract-transcript` - Extract transcript from file/URL
- `POST /api/transform` - Transform content to target format
- `GET /api/job/:jobId` - Get transformation job status
- `GET /api/content/history` - Get user's transformation history

### Strategy Generator
- `POST /api/strategy/start` - Start strategy generation
- `POST /api/strategy/:id/step/:step` - Execute strategy step
- `GET /api/strategy/:id` - Get strategy status
- `GET /api/strategy/history` - Get user's strategy history

### Writing Samples
- `GET /api/writing-samples` - List user's samples
- `POST /api/writing-samples` - Create new sample
- `DELETE /api/writing-samples/:id` - Delete sample

### Billing & Subscriptions
- `GET /api/subscription` - Get subscription status
- `GET /api/billing/dashboard` - Get billing overview
- `POST /api/create-subscription-checkout` - Create Stripe checkout session
- `POST /api/create-credit-pack-checkout` - Create credit pack checkout
- `GET /api/credit-packages` - List available credit packages

## Credit Calculation

### Format Base Costs (per transformation)
- Newsletter: ~2 credits (805 output + 500 system + transcript tokens)
- Social: ~2 credits (805 output + 500 system + transcript tokens)
- Blog: ~3 credits (1,610 output + 500 system + transcript tokens)
- X Thread: ~2 credits (575 output + 500 system + transcript tokens)

### Additional Costs
- **Style Matching**: +exact tokens from writing samples (up to ~1,600 tokens/2 credits)
- **LLMO Optimization** (blog only): +1,880 tokens (~2 credits)
- **Strategy Generator**:
  - Step 1 (Analysis): ~2 credits
  - Step 2 (Recommendations): ~2 credits
  - Step 3 (Titles): ~1-2 credits per format
  - Step 4 (Content): Standard format costs × number of formats
  - Step 5 (Calendar): ~2 credits

## Copyright & Legal

ContentHammer includes robust copyright compliance features:
- **Terms of Service** page with detailed legal protections
- **Copyright warnings** before upload zones
- **ToS acceptance checkbox** required before transformations
- **User warranties** about content ownership and permissions
- **Repeat infringer policy** and DMCA compliance

**Important**: Users must own content or have explicit permission to create derivative works.

## Development Guidelines

### Database Migrations
```bash
# Push schema changes to database
npm run db:push

# Force push (data loss warning)
npm run db:push --force
```

### Code Conventions
- Use Drizzle ORM for all database operations
- Validate requests with Zod schemas
- Use TanStack Query for data fetching
- Add `data-testid` attributes for interactive elements
- Follow existing component patterns (shadcn/ui)

### Testing
The application includes comprehensive E2E test coverage using Playwright for all user-facing features.

## Deployment

The application is designed for deployment on Replit:
1. Ensure all environment variables are set
2. Database will be automatically provisioned
3. Use Replit's "Publish" feature for production deployment

## Support & Contributing

For issues, feature requests, or questions:
- Contact: support@contenthammer.com
- Check the Terms of Service at `/terms`
- Review the Pricing page at `/pricing`

## License

Copyright © 2025 ContentHammer. All rights reserved.

---

**Powered by xAI Grok** 🚀
