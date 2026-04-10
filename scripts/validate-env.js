/**
 * Environment Variable Validation Script
 * Run this before starting the application to validate environment setup
 */

console.log('='.repeat(80));
console.log('Environment Variable Validation');
console.log('='.repeat(80));

// Check Node.js version
const nodeVersion = process.version;
console.log(`\nNode.js Version: ${nodeVersion}`);
if (parseInt(nodeVersion.slice(1).split('.')[0]) < 18) {
  console.error('❌ ERROR: Node.js version must be 18.x or higher');
  process.exit(1);
}
console.log('✓ Node.js version is compatible');

// Check required environment variables
console.log('\n' + '-'.repeat(80));
console.log('Required Environment Variables:');
console.log('-'.repeat(80));

const required = ['SWAGGER_URLS'];
let hasErrors = false;

required.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.error(`❌ MISSING: ${varName}`);
    hasErrors = true;
  } else {
    console.log(`✓ ${varName}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
  }
});

// Check optional environment variables
console.log('\n' + '-'.repeat(80));
console.log('Optional Environment Variables:');
console.log('-'.repeat(80));

const optional = [
  'PORT',
  'LOG_LEVEL',
  'AUTH_TYPE',
  'SWAGGER_TIMEOUT_MS',
  'ALLOW_INSECURE_TLS',
  'TOOL_NAME_PREFIX',
  'SERVICE_NAME_MODE',
  'DEFAULT_SERVICE_NAME',
  'MAX_TOOLS',
  'SWAGGER_REFRESH_SECONDS'
];

optional.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✓ ${varName}: ${value}`);
  } else {
    console.log(`  ${varName}: (not set, using default)`);
  }
});

// Check for indexed auth variables
console.log('\n' + '-'.repeat(80));
console.log('Authentication Configuration:');
console.log('-'.repeat(80));

const authVars = Object.keys(process.env).filter(key => 
  key.startsWith('SWAGGER_') && 
  (key.includes('AUTH') || key.includes('API_KEY') || key.includes('BEARER') || key.includes('OAUTH'))
);

if (authVars.length > 0) {
  authVars.forEach(varName => {
    const value = process.env[varName];
    // Mask sensitive values
    const maskedValue = varName.includes('SECRET') || varName.includes('TOKEN') || varName.includes('KEY')
      ? '***' + value.slice(-4)
      : value;
    console.log(`✓ ${varName}: ${maskedValue}`);
  });
} else {
  console.log('  No authentication variables configured (using AUTH_TYPE=none)');
}

// Validate SWAGGER_URLS format
console.log('\n' + '-'.repeat(80));
console.log('SWAGGER_URLS Validation:');
console.log('-'.repeat(80));

if (process.env.SWAGGER_URLS) {
  const urls = process.env.SWAGGER_URLS.split(',').map(url => url.trim()).filter(url => url.length > 0);
  console.log(`Found ${urls.length} URL(s):`);
  urls.forEach((url, index) => {
    try {
      new URL(url);
      console.log(`  ${index}: ✓ ${url}`);
    } catch (error) {
      console.error(`  ${index}: ❌ Invalid URL: ${url}`);
      hasErrors = true;
    }
  });
}

// Check for common issues
console.log('\n' + '-'.repeat(80));
console.log('Common Issues Check:');
console.log('-'.repeat(80));

// Check for quotes in values
if (process.env.SWAGGER_URLS && (process.env.SWAGGER_URLS.startsWith('"') || process.env.SWAGGER_URLS.startsWith("'"))) {
  console.warn('⚠️  WARNING: SWAGGER_URLS contains quotes - remove them in Azure portal');
}

// Check for spaces
if (process.env.SWAGGER_URLS && process.env.SWAGGER_URLS.includes(', ')) {
  console.warn('⚠️  WARNING: SWAGGER_URLS contains spaces after commas - remove them');
}

// Check PORT
const port = parseInt(process.env.PORT || '4000', 10);
if (isNaN(port) || port < 1 || port > 65535) {
  console.error('❌ ERROR: PORT must be a valid port number (1-65535)');
  hasErrors = true;
} else {
  console.log(`✓ PORT is valid: ${port}`);
}

// Summary
console.log('\n' + '='.repeat(80));
if (hasErrors) {
  console.error('❌ VALIDATION FAILED - Fix the errors above before starting the application');
  console.log('='.repeat(80));
  process.exit(1);
} else {
  console.log('✓ ALL VALIDATIONS PASSED - Environment is properly configured');
  console.log('='.repeat(80));
  process.exit(0);
}

// Made with Bob
