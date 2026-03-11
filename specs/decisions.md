# Decisions Log

## 2026-03-11: Removed LLMO/GEO Feature

**Decision:** Remove all LLMO/GEO (Large Language Model Optimization / Generative Engine Optimization) functionality from ContentHammer.

**Why:** Research showed the feature was mostly theater:
- The GEO "score" was the AI grading its own output -- not a meaningful quality metric
- Schema markup (JSON-LD) doesn't affect LLM citation rates
- ~80% of what was marketed as "GEO" is just good SEO practices (clear headings, answer-first formatting, structured content)
- The feature added ~2 credits of overhead per blog transformation with no real user value
- "People Also Ask" and keyword extraction were cosmetic, not actionable

**What we kept (baked into default blog prompt):**
- Question-based headings where natural
- Answer-first section formatting
- Data/statistics/concrete examples emphasis

**What we removed:**
- `useLLMO` toggle in UI (Quick Transform + Strategy Generator)
- LLMO report card in ContentPreview (GEO score, keywords, People Also Ask, schema markup, recommendations)
- `useLLMO` columns from `content_jobs` and `strategy_jobs` DB tables
- LLMO token overhead in credit calculations (~1,880 tokens/~2 credits per blog)
- LLMO/GEO branding from Landing page, Pricing page, and Pro plan features
- `llmo?` field from `BlogContent` TypeScript interface

**Impact:**
- Blog posts are now cheaper (no LLMO credit overhead)
- Simpler UI -- fewer checkboxes, less cognitive load
- Old stored content with `llmo` JSON field is silently ignored (no migration needed for content data)
- DB migration needed: `npm run db:push` drops `use_llmo` columns

**Files changed:** `server/grok.ts`, `server/credits.ts`, `server/strategy.ts`, `server/routes.ts`, `shared/schema.ts`, `client/src/pages/Home.tsx`, `client/src/components/ContentPreview.tsx`, `client/src/pages/Landing.tsx`, `client/src/pages/Pricing.tsx`, `README.md`, `replit.md`
