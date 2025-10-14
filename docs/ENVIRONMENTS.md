# Environments & Secrets

## Environments
- Development: local `npm run dev`
- Staging: auto-deploy from `main` (Render)
- Production: manual promotion after staging passes

## Required variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Optional variables
- `GEMINI_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_API_KEY`

## Local setup
- Create a `.env` and set the above keys.
- Never commit `.env` files.
