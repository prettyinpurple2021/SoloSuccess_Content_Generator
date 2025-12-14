# Production Environment Configuration

## Overview

This document outlines the complete production environment configuration for the SoloSuccess AI Content Factory, including Vercel deployment settings, environment variables, security configurations, and monitoring setup.

## Vercel Production Configuration

### Build Settings

- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node.js Version**: 20.x
- **Region**: `iad1` (US East - Virginia)

### Serverless Function Configuration

- **Runtime**: Node.js 20.x
- **Max Duration**: 30 seconds
- **Memory**: 1024 MB (default)
- **Timeout**: 10 seconds (API routes)

### Security Headers

Production deployment includes comprehensive security headers:

- **X-Content-Type-Options**: `nosniff`
- **X-Frame-Options**: `DENY`
- **X-XSS-Protection**: `1; mode=block`
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Permissions-Policy**: Restricts camera, microphone, geolocation

### Caching Strategy

- **Static Assets**: 1 year cache with immutable flag
- **API Routes**: No caching (dynamic content)
- **HTML**: No caching (SPA routing)

## Environment Variables

### Required Production Variables

⚠️ **SECURITY WARNING:** Never commit real credentials to version control. Always use Vercel Environment Variables for production secrets.

```bash
# Authentication (Stack Auth)
VITE_STACK_PROJECT_ID=your_stack_project_id_here
VITE_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_publishable_client_key_here
STACK_SECRET_SERVER_KEY=your_stack_secret_server_key_here

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# AI Services (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key_here

# Integration credential encryption
INTEGRATION_ENCRYPTION_SECRET=your_64_character_hex_encryption_secret_here
```

### Optional Providers

```bash
# Additional AI providers
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google services (only if used)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_API_KEY=your_google_api_key_here
```

**Important:** Set these environment variables in the Vercel Dashboard (Settings → Environment Variables) rather than in `vercel.json`. The `vercel.json` file should never contain secrets.

### Optional: Additional AI Services

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORGANIZATION_ID=your_openai_org_id_optional

# Anthropic Claude Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Note: Social Media & Analytics Integrations

Users connect their own social media accounts through OAuth flows in the app. You do NOT need to provide social media API credentials. Each user will authenticate with their own accounts (Twitter, LinkedIn, Facebook, Instagram, Reddit, Pinterest, etc.) through the Integration Manager in the app UI.

Same applies to analytics platforms - users connect their own Google Analytics, etc. accounts if they want to track their content performance.

## Deployment Process

### Automatic Deployment

1. **Git Integration**: Connected to GitHub repository
2. **Branch Strategy**:
   - `main` branch → Production deployment
   - Feature branches → Preview deployments
3. **Build Triggers**: Automatic on push to connected branches
4. **Rollback**: Instant rollback to previous deployments

### Manual Deployment via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Deploy with specific environment
vercel --prod --env production
```

### Build Optimization

- **Code Splitting**: Automatic chunk splitting for optimal loading
- **Tree Shaking**: Dead code elimination
- **Minification**: Terser minification with console removal
- **Asset Optimization**: Image and CSS optimization
- **Bundle Analysis**: Chunk size monitoring and warnings

## Performance Configuration

### Build Performance

- **Target**: ES2020 for modern browser support
- **Chunk Size Warning**: 1000kb threshold
- **Compressed Size Reporting**: Disabled for faster builds
- **Source Maps**: Disabled in production for security

### Runtime Performance

- **Lazy Loading**: Dynamic imports for heavy components
- **Code Splitting**: Vendor, UI, AI, and database service chunks
- **Asset Caching**: Long-term caching for static assets
- **CDN**: Vercel Edge Network for global distribution

### Memory and CPU Limits

- **Serverless Functions**: 1024 MB memory, 30s timeout
- **Build Process**: 8GB memory, 15-minute timeout
- **Concurrent Builds**: 3 concurrent builds (Pro plan)

## Security Configuration

### HTTPS and SSL

- **Automatic HTTPS**: Vercel provides automatic SSL certificates
- **HTTP to HTTPS**: Automatic redirect
- **HSTS**: HTTP Strict Transport Security enabled
- **Certificate Renewal**: Automatic Let's Encrypt renewal

### Content Security Policy

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://api.gemini.com https://*.neon.tech https://stack-auth.com;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
```

### Environment Variable Security

- **Encryption**: All environment variables encrypted at rest
- **Access Control**: Team-based access to environment variables
- **Audit Logging**: Changes to environment variables logged
- **Secret Rotation**: Regular rotation of API keys and secrets

## Monitoring and Observability

- **Vercel Analytics/Logs**: Web Vitals, function logs, deployment status
- **Neon Monitoring**: Connection health, query performance, connection counts
- **Sentry (frontend)**: Capture errors/perf if enabled
- **Synthetic checks**: Smoke-test auth, content generation, scheduler/publishing flows after deploy
- **Validation scripts**: `npm run validate:production`, `npm run validate:security`, `npm run validate:performance`, `npm run validate:readiness` before release

## Domain and SSL Configuration

### Custom Domain Setup

1. **Add Domain**: Add custom domain in Vercel dashboard
2. **DNS Configuration**: Configure DNS records:

   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com

   Type: A
   Name: @
   Value: 76.76.19.61
   ```

3. **SSL Certificate**: Automatic Let's Encrypt certificate
4. **Redirect Configuration**: www to non-www or vice versa

### Domain Security

- **DNSSEC**: Enable DNSSEC for domain security
- **CAA Records**: Certificate Authority Authorization
- **HSTS Preload**: HTTP Strict Transport Security preload

## Backup and Disaster Recovery

### Database Backup

- **Neon Automatic Backups**: Point-in-time recovery
- **Backup Retention**: 7 days for free tier, 30 days for paid
- **Cross-region Replication**: Available for paid plans

### Application Backup

- **Git Repository**: Source code backup in GitHub
- **Deployment History**: Vercel maintains deployment history
- **Environment Variables**: Backed up in Vercel dashboard
- **Asset Backup**: Static assets backed up with deployments

### Recovery Procedures

1. **Rollback Deployment**: Instant rollback to previous version
2. **Database Recovery**: Point-in-time recovery from Neon
3. **Environment Recovery**: Restore environment variables
4. **DNS Recovery**: Update DNS records if needed

## Cost Optimization

### Vercel Pricing Tiers

- **Hobby (Free)**:
  - 100GB bandwidth
  - 6,000 build minutes
  - Unlimited static sites
  - 12 serverless functions

- **Pro ($20/month)**:
  - 1TB bandwidth
  - 24,000 build minutes
  - Advanced analytics
  - Team collaboration

### Cost Monitoring

- **Bandwidth Usage**: Monitor monthly bandwidth consumption
- **Build Minutes**: Track build time usage
- **Function Invocations**: Monitor serverless function usage
- **Storage Usage**: Track static asset storage

### Optimization Strategies

- **Image Optimization**: Use Vercel Image Optimization
- **Edge Caching**: Leverage Vercel Edge Network
- **Bundle Size**: Monitor and optimize bundle sizes
- **Function Efficiency**: Optimize serverless function performance

## Compliance and Governance

### Data Privacy

- **GDPR Compliance**: User data handling compliance
- **Data Retention**: Configurable data retention policies
- **Data Encryption**: End-to-end encryption for sensitive data
- **Access Logging**: Comprehensive access logging

### Security Compliance

- **SOC 2 Type II**: Vercel SOC 2 compliance
- **ISO 27001**: Information security management
- **GDPR**: General Data Protection Regulation compliance
- **CCPA**: California Consumer Privacy Act compliance

### Audit Trail

- **Deployment Logs**: Complete deployment history
- **Access Logs**: User and admin access logging
- **Change Logs**: Environment variable and configuration changes
- **Security Logs**: Security events and incidents

## Troubleshooting Guide

### Common Issues

1. **Build Failures**:
   - Check environment variables
   - Verify dependencies in package.json
   - Review build logs in Vercel dashboard

2. **Runtime Errors**:
   - Check function logs
   - Verify API endpoints
   - Test database connectivity

3. **Performance Issues**:
   - Analyze bundle size
   - Check Web Vitals metrics
   - Review function execution times

4. **SSL/Domain Issues**:
   - Verify DNS configuration
   - Check certificate status
   - Review domain settings

### Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Vercel Support**: Available for Pro and Enterprise plans
- **Community Forum**: Vercel community discussions
- **Status Page**: https://vercel-status.com

## Success Metrics

### Performance Targets

- **Page Load Time**: < 2 seconds
- **Time to First Byte**: < 500ms
- **Core Web Vitals**: All metrics in "Good" range
- **Uptime**: 99.9% availability

### Business Metrics

- **User Engagement**: Session duration, page views
- **Feature Usage**: AI generation, social posting
- **Error Rate**: < 1% error rate
- **User Satisfaction**: Feedback and ratings

This production environment configuration ensures optimal performance, security, and reliability for the SoloSuccess AI Content Factory deployment on Vercel.
