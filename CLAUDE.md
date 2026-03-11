# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ContentHammer — AI-powered SaaS that transforms long-form content (podcasts, YouTube videos, Spotify, file uploads) into newsletters, social carousels, blog posts, and X threads. Includes a 5-step Strategy Generator wizard and writing style matching.

## Commands

```bash
npm run dev        # Dev server (Express + Vite HMR) on port 5000
npm run build      # Vite frontend build + esbuild backend bundle → dist/
npm run start      # Production server from dist/
npm run check      # TypeScript type checking
npm run db:push    # Push Drizzle schema changes to Neon PostgreSQL
```

No test or lint scripts exist.

## Architecture

**Monorepo structure: React frontend + Express backend, single process serving both.**

| Layer | Stack |
|-------|-------|
| Frontend | React 18, TypeScript, Vite, Wouter (routing), TanStack Query v5 |
| Backend | Express.js, TypeScript, Multer (uploads) |
| Database | PostgreSQL (Neon), Drizzle ORM |
| Auth | Replit OpenID Connect via Passport.js + express-session |
| AI | xAI Grok API (grok-4-fast-reasoning, 131K context) via OpenAI SDK |
| Payments | Stripe (subscriptions + one-time credit packs) |
| UI | Tailwind CSS, shadcn/ui (Radix primitives), Framer Motion |

### Key Files

- `shared/schema.ts` — Single source of truth for DB schema (Drizzle tables) and Zod validation schemas. Tables: users, sessions, contentJobs, strategyJobs, writingSamples, subscriptions, creditTransactions, creditPackages, creditPurchases.
- `server/routes.ts` — All API endpoints (~1400 lines). Main routes: `/api/extract-transcript`, `/api/transform`, `/api/subscription/*`, `/api/stripe/*`, `/api/content/history`, `/api/strategy/*`.
- `server/grok.ts` — AI transformation logic (calls xAI Grok for content generation).
- `server/strategy.ts` — 5-step Strategy Generator workflow execution.
- `server/credits.ts` — Credit calculation & pricing (1 credit = 1,000 tokens, 15% safety buffer on AI outputs only, exact counts for known inputs).
- `server/transcript.ts` — YouTube/Spotify transcript extraction.
- `server/storage.ts` — Database operations interface (CRUD via Drizzle).
- `server/replitAuth.ts` — Replit OpenID Connect auth setup.
- `client/src/App.tsx` — Frontend router (Wouter). Pages: Home, History, Writing Samples, Billing, Terms, Landing.
- `client/src/lib/queryClient.ts` — TanStack Query config + `apiRequest()` helper for authenticated API calls.

### Data Flow

1. User uploads content or pastes YouTube/Spotify URL
2. `POST /api/extract-transcript` extracts transcript
3. `POST /api/subscription/estimate` calculates credit cost
4. `POST /api/transform` sends transcript to Grok, deducts credits, saves result to `contentJobs`
5. Frontend displays transformed content via TanStack Query cache

### Credit System

- Fixed-price model: users pay the quoted estimate, not actual API usage
- Subscription tiers: Starter ($19/500 credits), Pro ($49/1,500 credits)
- One-time credit packs available; one-time credits consumed before subscription credits
- Hard block if insufficient credits (no override)
- New users get 250 free welcome credits

## Design System

Reference: `design_guidelines.md` for full specs. Key tokens:
- Primary: #6366F1 (Indigo), Secondary: #10B981 (Emerald), Accent: #F59E0B (Amber)
- Full dark mode support (class-based toggling)
- Notion-inspired clean aesthetic with generous whitespace

## Environment Variables

Required: `DATABASE_URL`, `XAI_API_KEY`, `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLIC_KEY`, `VITE_STRIPE_STARTER_PRICE_ID`, `VITE_STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `SESSION_SECRET`

Replit Auth: `REPLIT_DOMAINS`, `ISSUER_URL`, `CLIENT_ID`, `CLIENT_SECRET`

## Deployment

Deployed on Replit. Single Express process serves Vite-built static frontend from `dist/public/` and API routes. Stripe webhooks at `/api/stripe/webhook`.
