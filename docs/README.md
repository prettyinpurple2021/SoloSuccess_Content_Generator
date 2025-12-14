# SoloSuccess Documentation

Complete documentation for the SoloSuccess AI Content Generator platform.

## 📚 Documentation Index

### Getting Started

**For first-time setup:**

1. [Main README](../README.md) - Project overview and quick start
2. [Setup Checklist](setup/SETUP_CHECKLIST.md) - Step-by-step setup verification
3. [Stack Auth Setup](setup/STACK_AUTH_SETUP.md) - Authentication configuration
4. [Database Setup](setup/DATABASE_SETUP_INSTRUCTIONS.md) - Neon PostgreSQL setup
5. [Neon Migration Guide](NEON_MIGRATION_GUIDE.md) - Database schema migration
6. [Setup Guide](setup/SETUP_GUIDE.md) - Platform-specific content adaptation

**For users:**

- [API Credentials Setup](../API_CREDENTIALS_SETUP.md) - How users connect their social media accounts

### Architecture & Development

**Core architecture:**

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture overview (Vite+React+TypeScript, Stack Auth, Neon, AI services)
- [STYLEGUIDE.md](STYLEGUIDE.md) - UI/code conventions (Tailwind, Framer Motion, service-layer patterns)
- [INTEGRATIONS.md](INTEGRATIONS.md) - Integration patterns and orchestration

**Development resources:**

- [Integration Manager README](integrations/INTEGRATION_MANAGER_README.md) - Integration system implementation
- [Integration Services Documentation](integrations/INTEGRATION_SERVICES_DOCUMENTATION.md) - Platform-specific integration details
- [Database README](../database/README.md) - Database schema documentation
- [Neon Migration README](NEON_MIGRATION_README.md) - Neon-specific migration details
- [Utils README](../utils/README.md) - Utility functions and performance helpers

**AI coding agents:**

- [GitHub Copilot Instructions](../.github/copilot-instructions.md) - Production-grade agent guidance

### Deployment & Operations

**Deployment:**

- [Vercel Deployment Guide](deployment/VERCEL_DEPLOYMENT_GUIDE.md) - Complete deployment steps
- [Vercel Troubleshooting](deployment/VERCEL_TROUBLESHOOTING.md) - Common deployment issues
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment configuration reference
- [ENVIRONMENTS.md](ENVIRONMENTS.md) - Environment variables reference
- [Production Environment](PRODUCTION_ENVIRONMENT.md) - Production configuration details
- [Production Deployment Complete](PRODUCTION_DEPLOYMENT_COMPLETE.md) - Post-deployment verification

**Operations:**

- [OPERATIONS.md](OPERATIONS.md) - Runbooks and monitoring
- [Production Readiness Summary](deployment/PRODUCTION_READINESS_SUMMARY.md) - Production validation status
- [Performance Optimization Guide](PERFORMANCE_OPTIMIZATION_GUIDE.md) - Performance best practices
- [Troubleshooting Data Persistence](deployment/TROUBLESHOOTING_DATA_PERSISTENCE.md) - Database troubleshooting

### Security

- [SECURITY.md](SECURITY.md) - Security overview and patterns
- [Secret Scanning Quick Start](security/SECRET_SCANNING_QUICK_START.md) - Secret scanning setup
- [GitHub Secret Scanning Setup](security/GITHUB_SECRET_SCANNING_SETUP.md) - GitHub-specific scanning
- [Secret Scanning Setup](security/SECRET_SCANNING_SETUP.md) - Comprehensive scanning configuration
- [Security Fix Instructions](security/SECURITY_FIX_INSTRUCTIONS.md) - Security remediation guide
- [Security Fixes Completed](security/SECURITY_FIXES_COMPLETED.md) - Completed security work

### Historical/Archive

Outdated documentation moved to [archive/](archive/) for reference:

- [archive/PRODUCTION_UPGRADE_GUIDE.md](archive/PRODUCTION_UPGRADE_GUIDE.md) - Obsolete upgrade patterns
- [archive/DISABLE_RENDER_DEPLOYMENT.md](archive/DISABLE_RENDER_DEPLOYMENT.md) - Render platform (not used)
- [archive/README_DEPLOYMENT.md](archive/README_DEPLOYMENT.md) - Superseded by Vercel guides
- [archive/PROJECT_REVIEW_AND_RECOMMENDATIONS.md](archive/PROJECT_REVIEW_AND_RECOMMENDATIONS.md) - Outdated review
- [archive/REACT_INITIALIZATION_FIX.md](archive/REACT_INITIALIZATION_FIX.md) - Historical fix (now in index.tsx)

---

## Quick Reference

### Essential Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run typecheck              # Type checking

# Database
npm run setup:database         # Initialize Neon database
npm run migrate:neon           # Apply migrations
npm run test:neon              # Test connectivity

# Validation (before merge/deploy)
npm run lint:production        # Production-grade linting
npm run validate:production    # Production readiness check
npm run validate:security      # Security audit
npm run validate:performance   # Performance validation
npm run validate:readiness     # Complete pre-deployment check
```

### Current Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS + Framer Motion
- **Auth:** Stack Auth
- **Database:** Neon PostgreSQL
- **AI:** Google Gemini (+ optional OpenAI, Anthropic)
- **Hosting:** Vercel
- **Integrations:** Twitter, LinkedIn, Facebook, Instagram, Reddit, Pinterest (user OAuth)

### Key Patterns

- **Service layer only:** All external API calls in `services/`; components never call third-party APIs directly
- **Type safety:** Strict TypeScript + Zod validation for all external data
- **Data mapping:** Domain types (camelCase) in `types.ts` map to DB (snake_case) via `services/databaseService.ts`
- **Security:** AES-256-GCM credential encryption via `services/credentialEncryption.ts`
- **Production-only:** No mocks, placeholders, TODOs, or commented-out code

### Environment Variables (Required)

```bash
VITE_STACK_PROJECT_ID=your_stack_project_id
VITE_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_publishable_key
STACK_SECRET_SERVER_KEY=your_stack_secret_key
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
GEMINI_API_KEY=your_gemini_api_key
INTEGRATION_ENCRYPTION_SECRET=64_char_hex_secret
```

See [ENVIRONMENTS.md](ENVIRONMENTS.md) for complete list and optional providers.

---

## Documentation Guidelines

When updating documentation:

1. **Keep current:** Align with actual codebase, not aspirational state
2. **Production-only:** No mocks, placeholders, or incomplete implementations
3. **Scrub secrets:** Never commit real credentials; use placeholders
4. **Link internally:** Reference related docs for context
5. **Update this index:** Add new docs to appropriate section above
6. **Archive obsolete:** Move outdated docs to `archive/` with reason

For questions or doc improvements, open an issue or PR.
