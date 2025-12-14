# Architecture

## Frontend

- Vite + React + TypeScript SPA
- TailwindCSS for styling; Framer Motion for motion
- Glassmorphic theme via `components/HolographicTheme.tsx`

## Routing & Auth

- Root flow: `index.tsx` → `components/AppWithErrorHandling.tsx` → `App.tsx`; routing in `components/AppRouter.tsx`
- Stack Auth configured in `stack.ts`; React must be assigned globally at the top of `index.tsx` before any other imports
- Protected routes use `components/auth/ProtectedRoute.tsx`; `useUser()` for session access

## Service Layer

- All external I/O and third-party calls live under `services/`; components never call APIs directly
- AI: `services/geminiService.ts`, `services/enhancedGeminiService.ts`
- Integrations: `services/integrationOrchestrator.ts` with per-platform adapters in `services/integrations/*`
- Scheduling: `services/postScheduler.ts`, `services/schedulerService.ts`
- Webhooks: `services/webhookService.ts` with HMAC signatures and retry/backoff
- Security: `services/credentialEncryption.ts` (AES-256-GCM), `services/apiErrorHandler.ts` (Zod validation)

## Data

- Neon PostgreSQL (schema in `database/`)
- Domain types in `types.ts` (camelCase) map to DB snake_case via helpers in `services/databaseService.ts`
