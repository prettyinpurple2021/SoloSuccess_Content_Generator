# Remaining TypeScript Errors to Fix

## Summary
- Total errors: ~340 remaining
- Main categories:
  1. Undefined/null checks (TS2532, TS18048): ~150 errors
  2. Type mismatches (TS2345, TS2322): ~80 errors  
  3. Missing properties (TS2339, TS2551): ~50 errors
  4. Parameter count mismatches (TS2554): ~30 errors
  5. Other (TS2578, TS2503, etc.): ~30 errors

## Critical Fixes Applied
✅ App.tsx - Fixed tone type casting
✅ AppRouter.tsx - Fixed import path for App
✅ BrandVoiceManager.tsx - Fixed analyzeBrandVoice parameter
✅ CampaignManager.tsx - Added useUser hook, fixed all campaignService calls
✅ campaignService.ts - Fixed undefined checks in metrics calculation
✅ VoiceCommands.tsx - Fixed synthRef undefined checks
✅ useErrorRecovery.ts - Fixed extractRetryAfter undefined check
✅ useErrorState.ts - Fixed operation array access
✅ usePerformanceMonitoring.ts - Fixed memory type casting and lastEntry check
✅ advancedSecurityService.ts - Fixed createSecurityIncident integrationId

## Remaining High-Priority Fixes Needed

### 1. Services with Missing Methods (TS2339, TS2551)
**File: services/integrationTestingService.ts**
- Line 10: Import `socialMediaIntegrations` should be `SocialMediaIntegrations`  
- Line 11: Import `analyticsIntegrations` should be `AnalyticsIntegrations`
- Line 12: Import `aiServiceIntegrations` should be `AIServiceIntegrations`

**File: services/socialPlatformService.ts**
- Line 528: `db.getPostAnalytics` method doesn't exist
- Line 817-852: Platform clients missing `getTrendingTopics` method
- Line 888: `geminiService.geminiService` incorrect - should be direct method
- Line 931-966: Platform clients missing `getOptimizationData` method

**File: services/monitoringService.ts**
- Line 233-235: Unused `@ts-expect-error` directives should be removed

**File: services/rateLimitingService.ts**
- Line 509, 511: Unused `@ts-expect-error` directives

**File: services/credentialEncryption.ts**
- Line 72: Unused `@ts-expect-error` directive

### 2. Database Service Type Mismatches (TS2769, TS2345)
**File: services/enhancedDatabaseService.ts**
- Line 117, 130: `types` configuration incompatible with postgres Options type
- Line 212, 253: Query parameter spreading issues
- Line 271: Return type mismatch for UnwrapPromiseArray

**File: services/databasePerformanceService.ts**
- Line 198: readonly array assignment issue
- Line 282: Awaited type mismatch
- Line 420: Missing postgres namespace

### 3. Type Assertion/Narrowing Issues (TS2532, TS18048)

**Priority services to fix:**
- `aiUsageMonitoringService.ts` (lines 223, 283)
- `analyticsService.ts` (line 509)
- `cachingService.ts` (line 64)
- `clientMonitoringService.ts` (lines 77, 83)
- `enhancedGeminiService.ts` (line 157)
- `frontendPerformanceService.ts` (lines 109, 273)
- `geminiService.ts` (line 407)
- `integrationService.ts` (lines 436, 625, 626)
- `performanceMonitoringService.ts` (multiple lines)
- `productionMonitoringService.ts` (multiple lines)
- `schedulingService.ts` (multiple lines)
- `securityPerformanceService.ts` (multiple lines)

**Fix pattern:**
```typescript
// Before
const value = obj.property;
someFunction(value);

// After
const value = obj.property;
if (!value) throw new Error('Property required');
someFunction(value);

// OR
const value = obj.property ?? defaultValue;
someFunction(value);

// OR
someFunction(obj.property!); // Only if you're certain it exists
```

### 4. Redis Service Type Issues (TS2322, TS2339)
**File: services/redisService.ts**
- Lines 77, 112, 123, 140, 155: Type incompatibility between Redis and IORedis/UpstashRedis
- Lines 261, 264: Method signature mismatches
- Lines 317, 322, 338, 378: Missing methods or spread argument issues

**Fix:** Define a common interface or use conditional types

### 5. Integration Type Mismatches
**File: services/integrations/analyticsIntegrations.ts**
- Lines 3-4: Import non-existent types (FacebookAnalyticsCredentials, TwitterAnalyticsCredentials)
- Should use FacebookCredentials, TwitterCredentials instead

**File: services/integrations/aiServiceIntegrations.ts**
- Line 370: Missing 'model' property in CustomAIGenerationResult

### 6. Component Props/Configuration Issues
**File: services/reliableImageGenerationService.ts**
- Line 361: 'style' property doesn't exist in type

**File: services/aiLearningService.ts**
- Line 548: 'engagementRate' doesn't exist on TrendingTopic
- Line 550: 'contentTypes' doesn't exist in UserPreferences

**File: services/advancedSecurityService.ts**
- Lines 956-1042: Multiple properties don't exist on IntegrationConfig:
  - dataRetention
  - consentManagement
  - auditLogging
  - accessControls
  - dataIntegrity
  - accessLogging
  - backupAndRecovery
  - networkSecurity
  - vulnerabilityManagement
  - monitoringAndTesting

**Fix:** Either add these properties to IntegrationConfig or remove the checks

### 7. Utils Type Issues
**File: utils/performanceUtils.ts**
- Lines 27, 28: Generic type constraint issues
- Line 123, 317: Undefined value assignments

**File: services/utils/monitoringService.ts**
- Lines 102, 238: `.rows` property doesn't exist on RowList
- Multiple lines: Implicit 'any' types on parameters

## Systematic Fix Script Needed

To fix the remaining ~340 errors efficiently, create a script that:

1. **Adds null checks systematically:**
```typescript
// Find all: someVar.property
// Replace with: someVar?.property ?? defaultValue
```

2. **Fixes implicit any types:**
```typescript
// Find all: (param) =>
// Add types: (param: Type) =>
```

3. **Removes unused @ts-expect-error:**
```bash
grep -n "@ts-expect-error" services/*.ts | while read line; do
  # Check if next line has error, if not, remove directive
done
```

4. **Fixes import names:**
```bash
# Find: import { socialMediaIntegrations }
# Replace: import { SocialMediaIntegrations }
```

## Build Command to Test
```bash
npm run typecheck 2>&1 | tee typescript-errors.log
```

## Priority Order
1. Fix import/export names (quick wins)
2. Add missing methods or stub them  
3. Fix undefined checks in services
4. Fix Redis and database type issues
5. Clean up @ts-expect-error directives
6. Fix remaining utils and hooks

## Estimated Time
- High priority (build-breaking): 2-3 hours
- Medium priority (type safety): 2-3 hours
- Low priority (cleanup): 1 hour
- **Total: 5-7 hours for complete fix**
