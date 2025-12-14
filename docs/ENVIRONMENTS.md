# Environments & Secrets

## Environments

- Development: local `npm run dev`
- Preview: automatic deployments for pull requests (Vercel)
- Production: automatic deployments from main branch (Vercel)

## Required variables

- `VITE_STACK_PROJECT_ID`
- `VITE_STACK_PUBLISHABLE_CLIENT_KEY`
- `STACK_SECRET_SERVER_KEY`
- `DATABASE_URL`
- `GEMINI_API_KEY`
- `INTEGRATION_ENCRYPTION_SECRET`

## Optional variables

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_API_KEY`

## Local setup

- Create `.env.local` from `.env.example` and set the above keys.
- Never commit `.env` files; configure secrets per-environment in Vercel.
