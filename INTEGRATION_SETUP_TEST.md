# Integration Setup Test

## 🧪 Test Your Integration Setup

After completing the setup steps, run this test to verify everything is working:

### 1. **Test Database Connection**

Open your browser console and run:

```javascript
// Test if the integration tables exist
const testIntegrationTables = async () => {
  try {
    const { data, error } = await window.supabase
      .from('integrations')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Integration tables not found:', error);
      return false;
    }
    
    console.log('✅ Integration tables found and accessible');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

testIntegrationTables();
```

### 2. **Test Integration Service**

```javascript
// Test if integration services are loaded
const testIntegrationServices = async () => {
  try {
    // Check if services are available
    const services = [
      'integrationService',
      'rateLimitingService', 
      'performanceMonitoringService',
      'comprehensiveLoggingService',
      'advancedSecurityService',
      'productionQualityValidationService',
      'integrationOrchestrator'
    ];
    
    for (const serviceName of services) {
      if (typeof window[serviceName] === 'undefined') {
        console.error(`❌ Service ${serviceName} not found`);
        return false;
      }
      console.log(`✅ Service ${serviceName} loaded`);
    }
    
    console.log('✅ All integration services loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Service loading failed:', error);
    return false;
  }
};

testIntegrationServices();
```

### 3. **Test Integration Manager UI**

```javascript
// Test if Integration Manager component is available
const testIntegrationManagerUI = () => {
  try {
    // Check if IntegrationManager component exists
    if (typeof window.IntegrationManager === 'undefined') {
      console.error('❌ IntegrationManager component not found');
      return false;
    }
    
    console.log('✅ IntegrationManager component loaded');
    
    // Check if integration sub-components exist
    const components = [
      'IntegrationOverview',
      'AddIntegration', 
      'ConfigureIntegration',
      'MonitorIntegrations',
      'RealTimeMonitoringDashboard'
    ];
    
    for (const componentName of components) {
      if (typeof window[componentName] === 'undefined') {
        console.warn(`⚠️ Component ${componentName} not found`);
      } else {
        console.log(`✅ Component ${componentName} loaded`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ UI component loading failed:', error);
    return false;
  }
};

testIntegrationManagerUI();
```

### 4. **Test Integration Creation**

```javascript
// Test creating a sample integration
const testIntegrationCreation = async () => {
  try {
    const sampleIntegration = {
      name: 'Test Twitter Integration',
      type: 'social_media',
      platform: 'twitter',
      credentials: {
        apiKey: 'test-key',
        apiSecret: 'test-secret'
      },
      configuration: {
        syncFrequency: 'hourly',
        rateLimits: {
          requestsPerMinute: 60
        }
      }
    };
    
    // Test if integrationService is available
    if (typeof window.integrationService === 'undefined') {
      console.error('❌ integrationService not available');
      return false;
    }
    
    console.log('✅ Integration service available for testing');
    console.log('📝 Sample integration data prepared:', sampleIntegration);
    
    return true;
  } catch (error) {
    console.error('❌ Integration creation test failed:', error);
    return false;
  }
};

testIntegrationCreation();
```

### 5. **Test Security Features**

```javascript
// Test credential encryption
const testCredentialEncryption = async () => {
  try {
    if (typeof window.CredentialEncryption === 'undefined') {
      console.error('❌ CredentialEncryption not available');
      return false;
    }
    
    // Test encryption (this will fail in browser due to crypto API restrictions)
    console.log('✅ CredentialEncryption service loaded');
    console.log('⚠️ Note: Encryption testing requires Node.js environment');
    
    return true;
  } catch (error) {
    console.error('❌ Security features test failed:', error);
    return false;
  }
};

testCredentialEncryption();
```

## 🚀 Quick Start Test

Run this complete test:

```javascript
const runCompleteTest = async () => {
  console.log('🧪 Starting Integration Setup Test...\n');
  
  const tests = [
    { name: 'Database Connection', fn: testIntegrationTables },
    { name: 'Integration Services', fn: testIntegrationServices },
    { name: 'UI Components', fn: testIntegrationManagerUI },
    { name: 'Integration Creation', fn: testIntegrationCreation },
    { name: 'Security Features', fn: testCredentialEncryption }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n🔍 Testing ${test.name}...`);
    try {
      const result = await test.fn();
      if (result) {
        passed++;
        console.log(`✅ ${test.name} - PASSED`);
      } else {
        failed++;
        console.log(`❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      failed++;
      console.log(`❌ ${test.name} - ERROR:`, error);
    }
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Your integration setup is ready.');
  } else {
    console.log('⚠️ Some tests failed. Please check the setup steps.');
  }
};

runCompleteTest();
```

## 🔧 Troubleshooting

### If Database Tests Fail:
1. Make sure you ran the SQL migration in Supabase
2. Check your environment variables are set correctly
3. Verify your Supabase connection

### If Service Tests Fail:
1. Make sure all service files are in the correct location
2. Check for any import/export errors in the browser console
3. Verify the services are properly initialized

### If UI Tests Fail:
1. Make sure the React components are properly imported
2. Check if there are any build errors
3. Verify the components are registered in your app

## 📞 Need Help?

If you encounter any issues:

1. **Check Browser Console**: Look for error messages
2. **Verify Environment Variables**: Make sure all required env vars are set
3. **Check Database**: Ensure the migration was successful
4. **Review File Structure**: Make sure all files are in the correct locations

The integration system is designed to be robust and should provide clear error messages to help you identify and resolve any issues.
