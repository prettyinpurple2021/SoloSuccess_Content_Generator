# Operations

## Runbooks

- Restart service: redeploy in Vercel dashboard
- Purge CDN: Vercel cache purge
- Database: verify Neon status and connection pooling if errors spike

## Monitoring

- Error/perf tracking via Sentry (frontend) and Vercel/Neon logs
- Uptime pings against the production URL; synthetic smoke tests for auth + post creation

## On-call

- Escalate on deploy failures, auth outages (Stack Auth), or Neon connectivity/latency incidents
