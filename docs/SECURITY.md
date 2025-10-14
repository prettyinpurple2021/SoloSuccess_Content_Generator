# Security

- Secrets via Render/Cloudflare; never commit secrets
- CSP and headers configured in `nginx.conf`
- Webhook signature verification and replay protection
- Role-based access control and audit logs
- Encryption at-rest/transport via `credentialEncryption.ts`
