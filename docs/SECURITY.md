# Security

- Secrets via Vercel environment variables; never commit secrets
- Security headers and CSP configured in Vercel
- Credential encryption: AES-256-GCM via `services/credentialEncryption.ts`
- Webhook signature verification (HMAC-SHA256) and replay protection via `services/webhookService.ts`
- Input validation with Zod in service layer; all external I/O handled in `services/`
- Row-level security (RLS) policies enforced in Neon PostgreSQL schema
