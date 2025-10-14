# Deployment (Render + Cloudflare)

## Overview
- Containerized via Docker (multi-stage build) and served by Nginx.
- Cloudflare in front for SSL, WAF, caching, and image optimization.

## Steps
1. Create a Render Web Service from this repo (Docker runtime).
2. Confirm `render.yaml` exists; health check at `/healthz`.
3. Set env vars in Render dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (optional)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_API_KEY` (optional)
4. Point Cloudflare DNS to Render, enable proxy, SSL Full(strict).
5. Cache settings: default; bypass cache for `/index.html`.
6. Purge cache on deploy via Render deploy hook or CI.

## Environments
- dev: feature branches or PR previews.
- staging: `main` auto-deploy with smoke tests.
- prod: manual promotion after staging passes.

## Security
- CSP and headers in `nginx.conf`.
- Secrets only in server env; no secrets in client code.

## Troubleshooting
- Check Render logs; verify `/healthz` returns 200.
- Ensure env vars exist; Vite build fails if missing.
