# Architecture

## Frontend
- Vite + React + TypeScript SPA
- TailwindCSS for styling, Framer Motion for animation
- Global theme provider: `components/HolographicTheme.tsx`

## Routing & Auth
- `AppRouter.tsx` with protected/public routes
- Supabase Auth client via `services/supabaseService.ts`

## Services Layer
- Integration orchestration: `services/integrationOrchestrator.ts`
- Scheduling: `services/postScheduler.ts`, `services/schedulerService.ts`
- Analytics & performance: `services/analyticsService.ts`, `services/performanceMonitoringService.ts`
- Security & logging: `services/advancedSecurityService.ts`, `services/comprehensiveLoggingService.ts`

## Integrations
- Implemented under `services/integrations/*`
- Orchestrated via `integrationOrchestrator`

## Data
- Supabase (schema in `database/`)
- Types in `types.ts`
