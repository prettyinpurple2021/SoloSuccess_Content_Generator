# GitHub Copilot Instructions - SoloSuccess AI Content Generator

## AI Coding Agent Quickstart (SoloSuccess)

Use this condensed guide to be productive fast, then refer to the full sections below for deep details.

- **Architecture Overview:** Vite + React + TypeScript + Tailwind + Framer Motion; Auth via Stack Auth; DB via Neon PostgreSQL; AI via Google Gemini, OpenAI, Anthropic.
- **Root App Flow:** `index.tsx` → `AppWithErrorHandling` → `App.tsx` with routing in `components/AppRouter.tsx`.
- **React Initialization Gotcha:** First lines in `index.tsx` must assign React globally to prevent Stack Auth errors:
   ```ts
   import React from 'react';
   (window as any).React = React;
   ```
- **Service Layer Only:** External calls live in `services/` (AI, DB, integrations, webhooks, encryption). Components never call third‑party APIs or `fetch()` directly.
- **Types + Transformations:** Domain types in `types.ts` (camelCase). DB uses snake_case; convert in `services/databaseService.ts` via helpers like `postToDatabase()` and `postFromDatabase()`.

### Workflows
- **Dev:** `npm run dev`, `npm run build`, `npm run typecheck`, `npm run lint`, `npm run format`.
- **Lint (prod rules):** `npm run lint:production` (uses eslint.config.production.js).
- **DB Setup:** See [DATABASE_SETUP_INSTRUCTIONS.md](../../DATABASE_SETUP_INSTRUCTIONS.md) and [NEON_MIGRATION_GUIDE.md](../../NEON_MIGRATION_GUIDE.md). Scripts: `npm run setup:database`, `npm run migrate:neon`, `npm run test:neon`.
- **Validation (Prod readiness):** `npm run validate:production`, `npm run validate:security`, `npm run validate:performance`, `npm run validate:readiness`.
- **Env Vars:** Required: `VITE_STACK_PROJECT_ID`, `VITE_STACK_PUBLISHABLE_CLIENT_KEY`, `STACK_SECRET_SERVER_KEY`, `DATABASE_URL`, `GEMINI_API_KEY`, `INTEGRATION_ENCRYPTION_SECRET`. Optional: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, platform‑specific.

### Conventions
- **UI:** Tailwind utility classes only; glassmorphic design; Framer Motion for animations.
- **Components:** Function components + hooks; heavy views are lazy‑loaded via `components/LazyComponents.tsx` with `Suspense` fallbacks.
- **Error Handling:** Try‑catch in services; user‑friendly messages; runtime validation with Zod; global boundaries in `components/ErrorBoundaryEnhanced.tsx`.
- **Service Patterns:** Singleton instances, strict input/output validation, retries/backoff for network calls, rate limiting via service helpers.
- **Tests:** Add/extend tests for new services/components; prefer integration coverage for I/O paths.

### Integration Points
- **Auth:** Config in `stack.ts`; provider wrapping in `index.tsx`; `useUser()` in client components; route protection in `components/auth/ProtectedRoute.tsx`.
- **AI Services:** `services/geminiService.ts` (+ `enhancedGeminiService.ts`) for generation; usage and rate limits via `aiUsageMonitoringService.ts` and `aiRequestQueueService.ts`.
- **Social Integrations:** Orchestrated by `services/integrationOrchestrator.ts`; per‑platform services in `services/integrations/*` implement `testConnection()`, `publishPost()`, `getAnalytics()` with retries and rate limits.
- **Webhooks:** `services/webhookService.ts` provides CRUD + delivery with HMAC‑SHA256 signatures, exponential backoff, and `processPendingDeliveries()` for failed deliveries.
- **Credential Security:** `services/credentialEncryption.ts` (AES‑256‑GCM) for OAuth token storage — never store plaintext.
- **Scheduling/Publishing:** `services/postScheduler.ts` / `services/schedulerService.ts` run queued publications; status transitions persisted in DB.

### Files To Know
- Entry + Router: `index.tsx`, `components/AppWithErrorHandling.tsx`, `components/AppRouter.tsx`, `App.tsx`.
- Config: `vite.config.ts`, `tailwind.config.js`, `tsconfig.json`, `eslint.config.production.js`.
- Data + Services: `types.ts`, `services/databaseService.ts`, `services/integrationOrchestrator.ts`, `services/webhookService.ts`, `services/geminiService.ts`.
- Docs: `STACK_AUTH_SETUP.md`, `NEON_MIGRATION_GUIDE.md`, `VERCEL_DEPLOYMENT_GUIDE.md`, root `README.md`.

### Non‑Negotiables
- React must be globally assigned in `index.tsx` before any imports.
- Components never call external APIs — use the service layer.
- Strict TypeScript, Zod validation, comprehensive error handling.
- Use Neon (not Supabase); encrypt credentials; add DB indexes for new tables.
- No TODO comments, commented-out code, mocks, placeholders, or disabled/stubbed code anywhere.
- Run production lint/validation before merge: `npm run lint:production`, `npm run validate:production`, `npm run validate:security`, `npm run validate:performance`, `npm run validate:readiness`.

---
# GitHub Copilot Instructions - SoloSuccess AI Content Generator

## ⚠️ PRODUCTION-GRADE CODEBASE

**This application is built for production deployment.** All code must meet enterprise-grade quality standards:

- ✅ **No mocks, demos, or simulated implementations** - Every feature must be fully functional and production-ready
- ✅ **100% complete implementations** - No partial, stubbed, or placeholder code
- ✅ **Zero tolerance for fake data flows** - Real integrations with live services
- ✅ **Strict error handling & validation** - Handle all edge cases, network failures, and invalid states
- ✅ **Security-first patterns** - Encryption at rest, secure auth, credential management
- ✅ **Performance optimized** - Code splitting, lazy loading, memoization, query optimization
- ✅ **Observable & monitorable** - Error tracking (Sentry), performance monitoring, audit logging
- ✅ **Tested & validated** - Type-safe code, runtime validation (Zod), integration tests

When implementing any feature, ask: "Would this pass a security audit? Does it handle failures gracefully? Is this scalable?"

## Project Overview

**SoloSuccess** is an AI-powered content planning and publishing platform for production use. Users create, schedule, and publish content across multiple social media platforms (Twitter, LinkedIn, Facebook, Instagram, Reddit, Pinterest) and blogs using AI generation (Google Gemini, OpenAI, Anthropic Claude).

**Tech Stack:**

- Frontend: Vite + React + TypeScript + TailwindCSS + Framer Motion
- Auth: Stack Auth (enterprise authentication, replaces NextAuth.js and better-auth)
- Database: Neon PostgreSQL (production-grade managed database)
- AI: Google Gemini, OpenAI, Anthropic APIs (live AI service integrations)

---

## Critical Architecture Patterns

### 1. **React Entry Point & Global State Setup**

The app requires React to be available globally **before any imports**:

```typescript
// index.tsx - FIRST lines of code
import React from 'react';
(window as any).React = React;
```

Failure to do this causes "Cannot set properties of undefined (setting 'Children')" errors in Stack Auth. This is non-negotiable.

**Root structure** (`index.tsx` → `AppWithErrorHandling` → `App.tsx`):

- `index.tsx`: React initialization, Sentry setup, Router wrapping
- `AppWithErrorHandling`: Error boundaries, loading states, notification system
- `App.tsx`: Main dashboard with tab-based navigation

### 2. **Service Layer & Data Abstraction**

**Critical rule:** All external integrations and API calls stay in `services/`. Components never call third-party APIs directly.

**Service patterns:**

- Singleton instances: `export const serviceName = new ServiceClass()` or `ServiceClass.getInstance()`
- Database: `services/databaseService.ts` (exports `db`) and `services/neonService.ts` (Neon PostgreSQL client)
- AI: `services/geminiService.ts`, `services/enhancedGeminiService.ts`
- Integrations: `services/integrationOrchestrator.ts` orchestrates platform-specific integrations in `services/integrations/`
- Webhooks: `services/webhookService.ts` (exports `webhookService`) manages webhook CRUD, delivery, retries
- Encryption: `services/credentialEncryption.ts` with AES-256-GCM
- Error handling: `services/apiErrorHandler.ts` with Zod validation

**Data flow:**

1. Component calls `apiService.*` (client-facing wrapper)
2. `apiService` delegates to `db.*` (database operations)
3. `db.*` uses Neon PostgreSQL client
4. For AI: components call `geminiService.generateContent()` directly

### 3. **Stack Auth Integration (Auth System)**

Stack Auth replaces NextAuth.js. Configuration in `stack.ts`:

```typescript
// stack.ts - Server configuration
export const stackServerApp = new StackServerApp({
  projectId: process.env.VITE_STACK_PROJECT_ID,
  publishableClientKey: process.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY,
});
```

**Authentication flow:**

- Routes wrapped with `StackProvider` at `index.tsx`
- `useUser()` hook gets current user in client components
- Protected routes in `AppRouter.tsx` use `ProtectedRoute` wrapper
- Auth pages: `/auth/signin`, `/auth/signup`, `/handler/[...stack]/page.tsx`

### 4. **Database Schema & Types Mapping**

Database types in `types.ts` with camelCase interfaces map to snake_case PostgreSQL columns.

```typescript
// Component uses camelCase
interface Post {
  userId: string;
  scheduleDate?: Date;
}

// Database uses snake_case
interface DatabasePost {
  user_id: string;
  schedule_date?: string;
}
```

**Transform functions in `databaseService.ts`:**

- `postToDatabase()` converts Post → DatabasePost
- `postFromDatabase()` converts DatabasePost → Post

**Schema files:** `database/neon-complete-migration.sql` includes posts, integrations, brand_voices, audience_profiles, campaigns tables.

---

## Component & UI Conventions

### 1. **Styling**

- **Only** TailwindCSS utility classes, no inline styles or CSS modules
- Glassmorphic design: `bg-white/10 backdrop-blur-md` patterns
- Framer Motion for all animations: `motion.div`, `motion.button` wrappers
- Global theme provider: `HolographicTheme.tsx` provides gradient backgrounds

### 2. **Component Structure**

- Function components only, no class components
- Lazy loading via `LazyComponents.tsx` (createLazyComponent pattern)
- Error boundaries: `ErrorBoundaryEnhanced` with retry/reload/report options
- Loading states managed by `LoadingStateManager.tsx`

**Example:**

```tsx
import { LazyPerformanceInsights } from './LazyComponents';

// Lazy loading in JSX:
<Suspense fallback={<ComponentLoadingFallback name="PerformanceInsights" />}>
  <LazyPerformanceInsights />
</Suspense>;
```

### 3. **Type Safety**

- Strict TypeScript: no `any`, no `ts-ignore`
- Use Zod for runtime validation in services: `z.object({...}).parse(data)`
- Types in `types.ts` cover all domain entities (Post, Integration, BrandVoice, etc.)

---

## Key Services & Integration Points

### AI Content Generation

**`geminiService.ts` and `enhancedGeminiService.ts`:**

- Generate blog ideas, posts, summaries, platform-specific content
- Methods: `generateBlogIdeas()`, `generateBlogPost()`, `adaptContentForPlatform()`
- Error handling: wrapped in try-catch, fallback to error messages

**AI Usage Monitoring:**

- `aiUsageMonitoringService.ts` tracks requests, tokens, costs
- Rate limiting: `aiRequestQueueService.ts` queues and prioritizes requests

### Integration Orchestration

**`integrationOrchestrator.ts`:**

- Manages OAuth flows for Twitter, LinkedIn, Facebook, Instagram, Reddit, Pinterest
- Methods: `testConnection()`, `publishPost()`, `getAnalytics()`, `syncData()`
- Platform configs define rate limits, feature sets, content limits
- Each platform has service in `services/integrations/` (e.g., TwitterService)

**`integrationService.ts`:**

- Complete CRUD for integrations with encrypted credentials
- Methods: `getIntegrations()`, `createIntegration()`, `updateIntegration()`, `deleteIntegration()`
- Health monitoring: `checkIntegrationHealth()`, `getIntegrationMetrics()`
- Webhook management via `getWebhooks()`, `addWebhook()`, `updateWebhook()`, `deleteWebhook()`
- Rate limiting: `checkRateLimit()` enforces platform-specific limits

**`webhookService.ts`:**

- Real webhook CRUD operations with database persistence
- Methods: `createWebhook()`, `updateWebhook()`, `deleteWebhook()`, `getWebhooksForIntegration()`
- Webhook delivery: `deliverWebhook()` with retry logic, signature verification (HMAC-SHA256)
- Background processing: `processPendingDeliveries()` handles failed deliveries with exponential backoff
- Stats & testing: `getWebhookStats()`, `testWebhook()` for monitoring and debugging

**Credential Encryption:**

- `credentialEncryption.ts` encrypts user OAuth tokens with AES-256-GCM
- Never store credentials unencrypted in database
- Encrypt before DB insert, decrypt on retrieval

### Scheduling & Publishing

**`postScheduler.ts` and `schedulerService.ts`:**

- Queue posts for scheduled publication
- Cron-like execution for batch publishing
- Fallback: `schedulingService.ts` handles scheduling logic

**Data persistence:**

- Calendar view syncs with `posts` table
- Schedule date stored as ISO string, converted to Date on retrieval

---

## Recent Production Readiness Improvements

**Phase 1 Critical Fixes (Completed):**

1. ✅ **WebhookManager** - Replaced local state with real `webhookService` database calls
2. ✅ **geminiService** - Added comprehensive error handling with try-catch blocks and user-friendly messages
3. ✅ **MonitorIntegrations** - Moved fetch() calls to service layer via `db.getIntegrationAlerts()` and `db.getIntegrationLogs()`
4. ✅ **socialMediaOrchestrator** - Added `ENABLE_SIMULATED_POSTING` feature flag with deprecation warnings
5. ✅ **Image generation** - Documented incomplete methods with implementation guides

**Key Patterns from Phase 1:**

- All service methods must handle errors with try-catch
- Error messages should be user-friendly: `throw new Error("User message + technical details + next steps")`
- Components call services, never direct `fetch()` or third-party APIs
- Feature flags for incomplete features: check `process.env.FEATURE_NAME` and throw errors if disabled in production
- Document TODOs with clear implementation paths, don't leave silent failures

---

## Development Workflows

### Build & Validation

```bash
npm run dev                    # Start dev server (Vite)
npm run build                  # Production build
npm run typecheck              # Type check without emit
npm run lint                   # ESLint check
npm run format                 # Prettier formatting
npm run validate:production    # Pre-deploy validation
npm run validate:readiness     # Production readiness check
```

### Database Setup

```bash
npm run setup:database         # Initialize Neon database
npm run migrate:neon           # Apply migrations
npm run test:neon              # Test Neon connectivity
```

### Testing & Monitoring

```bash
npm run test                   # Integration tests (requires live credentials)
npm run validate:security      # Security validation
npm run validate:performance   # Performance validation
npm run scan:secrets           # Secret scanning pre-commit
```

### Validation Workflow Guide

**When to run validation scripts:**

1. **Before Every Commit** (Automatic):
   - Husky pre-commit hook runs `lint-staged` (ESLint + Prettier)
   - `npm run scan:secrets` checks for exposed credentials
   - TypeScript compilation via strict `tsconfig.json`

2. **Before Opening PR**:

   ```bash
   npm run typecheck              # Verify no TypeScript errors
   npm run lint:production        # Production-grade linting
   npm run validate:security      # Security audit
   ```

3. **Before Deployment**:

   ```bash
   npm run build                  # Ensure clean build
   npm run validate:performance   # Check lazy loading, bundle size
   npm run validate:readiness     # Full production readiness check
   ```

4. **After Major Changes**:
   - New service: `npm run validate:workflow` (end-to-end test)
   - Database schema: `npm run test:neon` (Neon connectivity)
   - Dependency updates: `npm audit` + `npm run build`

**Validation Script Details:**

- `production-readiness-validation.js` - Checks for mocks, placeholder code, missing error handling, security issues
- `performance-validation.js` - Validates lazy loading, code splitting, no console.logs in production
- `security-validation.js` - Scans for hardcoded secrets, unencrypted credentials, SQL injection risks
- `end-to-end-workflow-test.js` - Tests critical user flows (auth, content generation, publishing)

---

## Environment Variables & Setup

### Quick Setup for First-Time Development

**Step 1: Install Dependencies**

```bash
npm install
```

**Step 2: Create `.env.local` file** (copy from `.env.example`)

**Required Environment Variables:**

```bash
# Stack Auth (Get from https://app.stack-auth.com/)
VITE_STACK_PROJECT_ID=your-stack-project-id
VITE_STACK_PUBLISHABLE_CLIENT_KEY=your-stack-publishable-key
STACK_SECRET_SERVER_KEY=your-stack-secret-key

# Neon PostgreSQL (Get from https://neon.tech)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Google Gemini AI (Get from https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your-gemini-api-key

# Credential Encryption (Generate with command below)
INTEGRATION_ENCRYPTION_SECRET=64-character-hex-string
```

**Generate encryption secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Optional AI Providers:**

```bash
OPENAI_API_KEY=your-openai-key          # https://platform.openai.com/api-keys
ANTHROPIC_API_KEY=your-anthropic-key    # https://console.anthropic.com/
```

**Step 3: Setup Database**

```bash
npm run setup:database    # Initialize Neon database with schema
npm run migrate:neon      # Apply migrations
npm run test:neon         # Verify connection
```

**Step 4: Start Development**

```bash
npm run dev               # Start Vite dev server at http://localhost:5173
```

**Verification Checklist:**

- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm run dev` starts without errors
- [ ] Can access http://localhost:5173 and see login page
- [ ] Stack Auth login/signup works
- [ ] Can connect to Neon database (check browser console for errors)

---

## Project-Specific Patterns

### Content Generation Workflow

1. User enters blog topic → calls `handleGenerateBlogContent()`
2. `geminiService.generateBlogIdeas()` returns 3-5 ideas
3. User picks idea → `geminiService.generateBlogPost()` creates full post
4. Content adapted for each platform via `adaptContentForPlatform(topic, platform)`
5. Posts stored in `posts` table with `socialMediaPosts: {platform: content}`

### Post Publishing Workflow

1. User schedules post → stored with `status: 'scheduled'`, `scheduleDate: ISO`
2. `postScheduler` checks `scheduleDate` and publishes via `integrationOrchestrator`
3. For each connected platform, `publishPost()` called
4. Post status updated to `posted` with `postedAt: timestamp`
5. Analytics tracked in `analytics` table via `analyticsService`

### Error Handling

**Component level:**

- Try-catch blocks in all event handlers
- Display user-friendly messages via `setErrorMessage()`
- Clear messages after 5 seconds: `setTimeout(() => setErrorMessage(''), 5000)`
- **Test with real network failures and edge cases**

**Service level:**

- `apiErrorHandler` catches and transforms errors
- Zod validation errors converted to readable messages
- Database errors wrapped with context and retried when appropriate
- **All API calls must handle timeouts, rate limits, and connection errors**

**Global level:**

- `ErrorBoundaryEnhanced` catches render errors
- Sentry captures unhandled exceptions
- `useErrorReporting()` hook for user feedback
- **Production monitoring enabled in all environments**

---

## Common Tasks & Patterns

### Adding a New Service

1. Create `services/newService.ts`
2. Define class with static methods or instance methods
3. Export singleton: `export const newService = new NewService()`
4. **Wrap all external API calls in try-catch blocks**
5. **Use Zod for runtime validation of all inputs and outputs**
6. **Handle all error cases: timeouts, rate limits, invalid responses**
7. Import in components via `apiService` or direct service import
8. **Test with real APIs before merging, not mocks**

### Adding a Database Table

1. Add migration SQL to `database/neon-complete-migration.sql`
2. Define TypeScript interfaces in `types.ts` (PascalCase + Database variant)
3. Add **complete CRUD methods** to `databaseService.ts` (Create, Read, Update, Delete)
4. **Include input validation and error handling**
5. Wrap in `apiService` if client-facing
6. Transform data with camelCase/snake_case helpers
7. **Add database indexes for query performance**
8. **Test migrations with real Neon database**

### Adding a Platform Integration

1. Create `services/integrations/YourPlatformService.ts`
2. **Implement complete OAuth flow with refresh token handling**
3. Add to `integrationOrchestrator.ts` platform configs
4. **Test with real platform APIs (not sandboxes)**
5. **Handle rate limits, retries, and exponential backoff**
6. Implement `testConnection()`, `publishPost()`, `getAnalytics()`
7. **Validate API responses with Zod schemas**
8. **Document all required credentials and permissions**

### Adding a Component

1. Create in `components/` with TypeScript interfaces
2. Use TailwindCSS + Framer Motion for styling/animation
3. Lazy load if heavy: create wrapper in `LazyComponents.tsx`
4. Wrap with `ErrorBoundary` if rendering complex logic
5. Call services via `apiService`, never direct API calls

### Implementing Webhooks for Integrations

When adding webhook support to an integration:

1. **Database Schema**: Ensure `integration_webhooks` and `webhook_deliveries` tables exist
2. **Service Methods**: Use `webhookService` for all webhook operations:
   ```typescript
   await webhookService.createWebhook(integrationId, webhookConfig);
   await webhookService.deliverWebhook(webhookId, event, payload);
   ```
3. **Signature Verification**: Always use HMAC-SHA256 for webhook signatures
4. **Retry Logic**: Implement exponential backoff (initial: 1s, max: 30s, multiplier: 2)
5. **Background Processing**: Use `processPendingDeliveries()` for failed webhook retries
6. **Component Integration**: Components should call `webhookService` methods, never manage webhook state locally

**Example Pattern:**

```typescript
// Component loads webhooks
const webhooks = await webhookService.getWebhooksForIntegration(integrationId);

// Create new webhook
const newWebhook = await webhookService.createWebhook(integrationId, {
  url: 'https://example.com/webhook',
  events: ['post.created', 'post.published'],
  isActive: true,
});
```

---

## AI Agent Workflow Guides

### When Adding a New AI Provider (e.g., Claude, GPT-4)

1. **Create Service File**: `services/[provider]Service.ts`

   ```typescript
   export class ClaudeService {
     async generateContent(prompt: string): Promise<string> {
       // Implement with proper error handling
     }
   }
   export const claudeService = new ClaudeService();
   ```

2. **Update AI Orchestrator**: Add provider to `services/aiOrchestrator.ts` or `enhancedGeminiService.ts`
3. **Environment Variables**: Add `[PROVIDER]_API_KEY` to `.env.example` and document in README
4. **Error Handling**: Wrap all API calls in try-catch with user-friendly messages
5. **Rate Limiting**: Implement via `aiRequestQueueService.ts`
6. **Usage Tracking**: Integrate with `aiUsageMonitoringService.ts`
7. **Testing**: Test with real API key, verify error cases (invalid key, rate limits, timeouts)

### When Integrating a New Social Platform (e.g., TikTok, Threads)

1. **Platform Service**: Create `services/integrations/[Platform]Service.ts`

   ```typescript
   export class TikTokService {
     async testConnection(credentials: any): Promise<ConnectionTestResult> {}
     async publishPost(credentials: any, content: any): Promise<any> {}
     async getAnalytics(credentials: any): Promise<any> {}
   }
   ```

2. **OAuth Flow**:
   - Add OAuth config to `integrationOrchestrator.ts` platform configs
   - Define required scopes, endpoints, and credential structure
   - Implement token refresh logic

3. **Database Schema**: Add platform to integration types in `types.ts`
4. **Credential Encryption**: Use `credentialEncryption.ts` for all OAuth tokens
5. **Rate Limits**: Define platform-specific limits in `integrationOrchestrator.ts`
6. **Content Adaptation**: Add platform rules to `contentAdaptationService.ts`
7. **Testing**: Test OAuth flow, post publishing, analytics retrieval with real account

### When Building a New Feature

1. **Architecture First**:
   - Identify service layer needs (new service or extend existing?)
   - Define database schema changes (if any)
   - Map out component → service → database data flow

2. **Service Layer** (if needed):

   ```typescript
   // services/myFeatureService.ts
   export class MyFeatureService {
     async doSomething(): Promise<Result> {
       try {
         // Validate inputs with Zod
         const validated = MySchema.parse(input);
         // Call database
         const data = await db.myOperation(validated);
         // Return transformed data
         return transformToResult(data);
       } catch (error) {
         throw new Error(`User-friendly message: ${error.message}`);
       }
     }
   }
   export const myFeatureService = new MyFeatureService();
   ```

3. **Database Changes** (if needed):
   - Update `database/neon-complete-migration.sql`
   - Add types to `types.ts` (both camelCase and snake_case)
   - Add CRUD methods to `databaseService.ts`
   - Run `npm run migrate:neon`

4. **Component Implementation**:
   - Create in `components/MyFeature.tsx`
   - Use TailwindCSS for styling (glassmorphic patterns)
   - Add Framer Motion animations
   - Lazy load if heavy: add to `LazyComponents.tsx`
   - Call service methods, never direct API calls

5. **Error Handling**:
   - Component: try-catch in event handlers, show user-friendly errors
   - Service: comprehensive error messages with context
   - Global: `ErrorBoundaryEnhanced` catches render errors

6. **Validation Checklist**:
   - [ ] `npm run typecheck` passes
   - [ ] `npm run lint:production` passes
   - [ ] No console.logs in production code
   - [ ] All async operations have error handling
   - [ ] Credentials encrypted (if applicable)
   - [ ] Database queries indexed (if new tables)
   - [ ] Component lazy loaded (if >100KB)
   - [ ] Real API tested, not mocked

### When Fixing Bugs or Refactoring

1. **Understand Current State**:
   - Read relevant service files in `services/`
   - Check database schema in `database/neon-complete-migration.sql`
   - Review component dependencies

2. **Maintain Production Standards**:
   - Don't introduce mocks or placeholders
   - Keep error handling comprehensive
   - Preserve type safety
   - Test with real services

3. **Update Tests & Validation**:
   - Run `npm run typecheck` after changes
   - Run `npm run validate:production` before committing
   - Verify no new console.logs added

---

## Key Files Reference

**Core:**

- `App.tsx` - Main dashboard, tab routing, central state management
- `index.tsx` - React initialization, Sentry, root rendering
- `types.ts` - All TypeScript interfaces (~800 lines)

**Authentication:**

- `stack.ts` - Stack Auth configuration
- `components/auth/ProtectedRoute.tsx` - Route protection
- `components/Auth.tsx` - Auth UI components

**Services (Essential):**

- `services/databaseService.ts` - Neon PostgreSQL operations
- `services/integrationOrchestrator.ts` - Multi-platform orchestration
- `services/geminiService.ts` - AI content generation
- `services/credentialEncryption.ts` - AES-256-GCM encryption
- `services/apiErrorHandler.ts` - Error handling with Zod validation

**Components (Key):**

- `components/IntegrationManager.tsx` - OAuth/credential management
- `components/CalendarView.tsx` - Scheduled post visualization
- `components/SmartScheduler.tsx` - Scheduling UI
- `components/AnalyticsDashboard.tsx` - Performance insights

**Build & Config:**

- `vite.config.ts` - Vite configuration with server module stubbing
- `tsconfig.json` - TypeScript strict mode enabled
- `tailwind.config.js` - Tailwind theme customization
- `eslint.config.js` & `eslint.config.production.js` - Linting rules

---

## Performance Considerations

- **Code splitting:** Chunk React, UI libs, AI libs separately (vite.config.ts)
- **Lazy loading:** Use `Suspense` + `LazyComponents` for heavy features
- **Memoization:** Use `useMemo()`, `useCallback()` for expensive computations
- **Database:** Indexed queries, pagination in `PaginationControls.tsx`
- **Monitoring:** Frontend performance tracked via `frontendPerformanceService.ts`

---

## Production Quality Standards

This codebase **must maintain enterprise-grade quality** at all times:

### Code Quality

- ✅ **Real implementations only** - No mock data, fake API calls, or simulated features
- ✅ **Complete features** - Every feature fully implemented, tested, and production-ready
- ✅ **No placeholder code** - If a feature isn't ready, feature-flag it; don't commit stubs
- ✅ **Proper error handling** - All async operations handle success, failure, timeout, and network error cases
- ✅ **Type safety** - Strict TypeScript, no `any`, no `ts-ignore`
- ✅ **Runtime validation** - Zod schemas validate all external data
- ✅ **Security hardened** - Encrypt credentials, validate inputs, sanitize outputs, HTTPS only

### Patterns to AVOID

❌ Inline API calls in components (use services/)  
❌ Store credentials in plain text (use credentialEncryption)  
❌ Skip TypeScript types (strict mode enforced)  
❌ Import Supabase (project uses Neon PostgreSQL)  
❌ Use CSS Modules or inline styles (TailwindCSS only)  
❌ Comment out code (remove or feature-flag instead)  
❌ Class components (function components + hooks)  
❌ **Mock/placeholder/simulated implementations** (real behavior only)  
❌ **Stub functions that just log or return dummy data** (complete the feature or remove it)  
❌ **"TODO: implement later" comments** (either implement now or create a GitHub issue)  
❌ **Fake success/error states** (test with real API responses)  
❌ **Disabled features with no cleanup** (remove code or add proper feature flags)  
❌ **Environment-dependent behavior not documented** (document all config requirements)

---

## Deployment

**Vercel deployment:**

- Configure environment variables in Vercel dashboard
- Push to main branch → automatic deployment
- SPA routing fallback configured in `vercel.json`
- Check `VERCEL_DEPLOYMENT_GUIDE.md` for step-by-step instructions

---

## Enforcing These Instructions

### 1. **Pre-Commit Hooks**

Husky + lint-staged automatically validate code before commits:

```bash
npm run prepare  # Install husky hooks
```

**Enforced checks:**

- ESLint (`eslint . --ext .ts,.tsx`)
- Prettier formatting
- Secret scanning (`npm run scan:secrets`)
- Type checking prevented via `tsconfig.json` strict mode

### 2. **Build-Time Validation**

Run before shipping code:

```bash
npm run lint:production    # Production-grade ESLint rules
npm run validate:security  # Security audit
npm run validate:performance # Performance checks
npm run validate:readiness # Comprehensive production readiness
```

**These scripts verify:**

- No mocks or placeholder code
- No commented-out code
- Complete error handling
- No direct API calls from components
- Database transactions have proper error handling
- All integrations use real services
- No credentials in code

### 3. **Pull Request Checklist**

Before opening a PR, verify:

- [ ] `npm run typecheck` passes (strict TypeScript)
- [ ] `npm run lint:production` passes
- [ ] `npm run format` was run
- [ ] `npm run validate:security` passes
- [ ] `npm run validate:performance` passes
- [ ] All async operations handle errors (try-catch or .catch())
- [ ] All external data validated with Zod
- [ ] Database credentials encrypted
- [ ] No mock data or stub functions remain
- [ ] Feature is 100% complete (not partial/TODO)
- [ ] Tested with real services, not mocks
- [ ] Error messages are user-friendly
- [ ] All new services have error handling
- [ ] All database changes include indexes
- [ ] Integration code handles rate limits/retries

### 4. **Code Review Gates**

Require review focus on:

- **Real implementations:** Does this work with production services or does it use mocks?
- **Error handling:** All edge cases covered? Network failures handled?
- **Validation:** Zod schemas for external data? Input sanitization?
- **Security:** No hardcoded secrets? Credentials encrypted? SQL injection prevention?
- **Completeness:** Feature 100% done or is it stubbed/partial?
- **Testing:** Tested with real APIs or just simulated responses?
- **Performance:** Lazy loading? Database queries optimized? Memory leaks?
- **Monitoring:** Errors tracked? Performance monitored? Audit logs?

### 5. **CI/CD Pipeline Configuration**

Add to your GitHub Actions `.github/workflows/`:

```yaml
# Example: .github/workflows/production-checks.yml
name: Production Quality Checks
on: [pull_request, push]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint:production
      - run: npm run validate:security
      - run: npm run validate:performance
      - run: npm run validate:readiness
```

### 6. **Code Patterns to Block (ESLint Rules)**

Ensure `eslint.config.production.js` enforces:

```javascript
// Block patterns that indicate mocks/stubs:
'no-console': ['error', { allow: ['warn', 'error'] }] // Debug logs only in dev
'no-todo': 'error'  // No TODO comments
'no-commented-code': 'error'  // No commented-out code
'no-async-without-error-handling': 'error'  // All async ops must handle errors
```

### 7. **Automated Validation Scripts**

Run validation regularly:

```bash
npm run scan:secrets              # Pre-commit secret detection
npm run validate:production       # Full production validation
npm run validate:readiness        # Pre-deployment readiness check
npm run build:analyze             # Bundle size analysis
```

**Key validation checks in scripts:**

- `scripts/production-readiness-validation.js` - Comprehensive checks
- `scripts/security-validation.js` - Security audit
- `scripts/performance-validation.js` - Performance validation
- `scripts/validate-ai-services.js` - AI service validation

### 8. **Monitoring in Production**

Once deployed, monitor compliance:

```bash
# Sentry - Real error tracking
import * as Sentry from '@sentry/react';

# Performance monitoring
frontendPerformanceService.trackPageLoad()
aiUsageMonitoringService.trackTokenUsage()

# Audit logging
advancedSecurityService.logSecurityEvent()
```

### 9. **Manual Review Checklist for Complex Features**

For critical features (integrations, auth, payments), verify:

1. **Architecture Review**
   - [ ] Service layer properly isolated
   - [ ] Data flows correctly through types.ts
   - [ ] Error handling at each layer
   - [ ] No circular dependencies

2. **Security Review**
   - [ ] Credentials encrypted with AES-256-GCM
   - [ ] No secrets in logs or error messages
   - [ ] Input validation with Zod
   - [ ] Output sanitization
   - [ ] HTTPS enforcement

3. **Testing Review**
   - [ ] Works with real service APIs
   - [ ] Handles network failures
   - [ ] Rate limit behavior tested
   - [ ] Token refresh tested (if OAuth)
   - [ ] Error messages user-friendly

4. **Performance Review**
   - [ ] Database queries indexed
   - [ ] Lazy loading implemented (if heavy)
   - [ ] No N+1 queries
   - [ ] Memoization for expensive ops

5. **Observability Review**
   - [ ] Errors logged with context
   - [ ] Performance metrics tracked
   - [ ] User feedback mechanism present
   - [ ] Sentry integration configured

### 10. **Continuous Learning & Documentation**

Keep standards high by:

- **Document patterns:** Update this file when discovering new critical patterns
- **Record decisions:** Use GitHub issues to document why certain approaches are taken
- **Review metrics:** Check validation logs regularly for patterns of non-compliance
- **Team alignment:** Share validation reports with team weekly

---

## Additional Resources

- `ARCHITECTURE.md` - System design overview
- `INTEGRATION_MANAGER_README.md` - Integration details
- `API_CREDENTIALS_SETUP.md` - User OAuth setup guide
- `NEON_MIGRATION_GUIDE.md` - Database migration reference
- `.cursor/.cursorrules` - Original Cursor IDE rules
