# Integrations

- Providers live under `services/integrations/*`, orchestrated via `services/integrationOrchestrator.ts`
- Rate limits + retries/backoff handled in the service layer; no direct API calls from components
- Webhook CRUD/delivery/retry flows in `services/webhookService.ts` with HMAC signatures
- Credentials encrypted via `services/credentialEncryption.ts`; configure env vars in Vercel (never in client bundles)
