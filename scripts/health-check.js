#!/usr/bin/env node

/**
 * Sidra Board System Health Check
 * Verifies all components and dependencies are working correctly
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

console.log('🏛️  Sidra Board System Health Check');
console.log('=====================================\n');

let errors = 0;
let warnings = 0;

// Check function
const check = (name, condition, message, isWarning = false) => {
  if (condition) {
    console.log(`✅ ${name}`);
  } else {
    if (isWarning) {
      console.log(`⚠️  ${name} - ${message}`);
      warnings++;
    } else {
      console.log(`❌ ${name} - ${message}`);
      errors++;
    }
  }
};

// 1. Check core files exist
console.log('📁 Checking Core Files...');
check('package.json', existsSync(join(projectRoot, 'package.json')), 'Missing package.json');
check('Firebase config', existsSync(join(projectRoot, 'firebase.json')), 'Missing firebase.json');
check('Firestore rules', existsSync(join(projectRoot, 'firestore.rules')), 'Missing firestore.rules');
check('Storage rules', existsSync(join(projectRoot, 'storage.rules')), 'Missing storage.rules');
check('Environment example', existsSync(join(projectRoot, 'env.example')), 'Missing env.example');

// 2. Check key components
console.log('\n🧩 Checking Components...');
const componentsPath = join(projectRoot, 'src/lib/components');
check('Navigation', existsSync(join(componentsPath, 'Navigation.svelte')), 'Missing Navigation component');
check('LoadingSpinner', existsSync(join(componentsPath, 'LoadingSpinner.svelte')), 'Missing LoadingSpinner');
check('DocumentUpload', existsSync(join(componentsPath, 'DocumentUpload.svelte')), 'Missing DocumentUpload');
check('DocumentViewer', existsSync(join(componentsPath, 'DocumentViewer.svelte')), 'Missing DocumentViewer');
check('MeetingScheduler', existsSync(join(componentsPath, 'MeetingScheduler.svelte')), 'Missing MeetingScheduler');
check('MeetingDetails', existsSync(join(componentsPath, 'MeetingDetails.svelte')), 'Missing MeetingDetails');
check('ChatAssistant', existsSync(join(componentsPath, 'ChatAssistant.svelte')), 'Missing ChatAssistant');

// 3. Check stores
console.log('\n🗄️  Checking Stores...');
const storesPath = join(projectRoot, 'src/lib/stores');
check('Auth store', existsSync(join(storesPath, 'auth.ts')), 'Missing auth store');
check('Documents store', existsSync(join(storesPath, 'documents.ts')), 'Missing documents store');
check('Meetings store', existsSync(join(storesPath, 'meetings.ts')), 'Missing meetings store');

// 4. Check utilities
console.log('\n🔧 Checking Utilities...');
const utilsPath = join(projectRoot, 'src/lib/utils');
check('Permissions', existsSync(join(utilsPath, 'permissions.ts')), 'Missing permissions utility');
check('Encryption', existsSync(join(utilsPath, 'encryption.ts')), 'Missing encryption utility');
check('Audit', existsSync(join(utilsPath, 'audit.ts')), 'Missing audit utility');

// 5. Check AI integration
console.log('\n🤖 Checking AI Integration...');
const aiPath = join(projectRoot, 'src/lib/ai');
check('OpenAI integration', existsSync(join(aiPath, 'openai.ts')), 'Missing OpenAI integration');
check('Groq integration', existsSync(join(aiPath, 'groq.ts')), 'Missing Groq integration');

// 6. Check routes
console.log('\n🛣️  Checking Routes...');
const routesPath = join(projectRoot, 'src/routes');
check('Dashboard', existsSync(join(routesPath, 'dashboard/+page.svelte')), 'Missing dashboard');
check('Login', existsSync(join(routesPath, 'login/+page.svelte')), 'Missing login page');
check('Documents', existsSync(join(routesPath, 'documents/+page.svelte')), 'Missing documents page');
check('Meetings', existsSync(join(routesPath, 'meetings/+page.svelte')), 'Missing meetings page');
check('Reports', existsSync(join(routesPath, 'reports/+page.svelte')), 'Missing reports page');
check('Settings', existsSync(join(routesPath, 'settings/+page.svelte')), 'Missing settings page');
check('Admin Users', existsSync(join(routesPath, 'admin/users/+page.svelte')), 'Missing admin users page');
check('Members', existsSync(join(routesPath, 'members/+page.svelte')), 'Missing members page');

// 7. Check package.json dependencies
console.log('\n📦 Checking Dependencies...');
try {
  const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  check('Firebase', deps.firebase, 'Firebase not installed');
  check('SvelteKit', deps['@sveltejs/kit'], 'SvelteKit not installed');
  check('Tailwind CSS', deps.tailwindcss, 'Tailwind CSS not installed');
  check('OpenAI', deps.openai, 'OpenAI SDK not installed');
  check('Groq', deps['groq-sdk'], 'Groq SDK not installed');
  check('Crypto-js', deps['crypto-js'], 'Crypto-js not installed');
  check('Lucide icons', deps['lucide-svelte'], 'Lucide icons not installed');
  check('Date-fns', deps['date-fns'], 'Date-fns not installed');
} catch (error) {
  check('Package.json readable', false, 'Cannot read package.json');
}

// 8. Check environment setup
console.log('\n🔐 Checking Environment...');
check('Environment example', existsSync(join(projectRoot, 'env.example')), 'Missing env.example');
check('Environment file', existsSync(join(projectRoot, '.env')), 'Missing .env file - copy from env.example', true);

// 9. Check mobile app
console.log('\n📱 Checking Mobile App...');
const mobileRoot = join(projectRoot, '../sidra-board-mobile');
check('Mobile package.json', existsSync(join(mobileRoot, 'package.json')), 'Missing mobile package.json');
check('Mobile app.ts', existsSync(join(mobileRoot, 'app.ts')), 'Missing mobile app.ts');
check('Mobile App.svelte', existsSync(join(mobileRoot, 'src/App.svelte')), 'Missing mobile App.svelte');

// 10. Check documentation
console.log('\n📚 Checking Documentation...');
check('README', existsSync(join(projectRoot, '../README.md')), 'Missing README.md');
check('User Manual', existsSync(join(projectRoot, '../docs/user-manual.md')), 'Missing user manual');
check('Deployment Guide', existsSync(join(projectRoot, '../docs/deployment-guide.md')), 'Missing deployment guide');

// Summary
console.log('\n📊 Health Check Summary');
console.log('=======================');

if (errors === 0 && warnings === 0) {
  console.log('🎉 All checks passed! System is ready to deploy.');
} else {
  console.log(`❌ ${errors} errors found`);
  console.log(`⚠️  ${warnings} warnings found`);
  
  if (errors > 0) {
    console.log('\n🔧 Please fix the errors before deploying to production.');
  }
  
  if (warnings > 0) {
    console.log('\n💡 Consider addressing warnings for optimal performance.');
  }
}

console.log('\n🚀 Next Steps:');
console.log('1. Copy env.example to .env and configure your API keys');
console.log('2. Run "firebase login" to authenticate with Firebase');
console.log('3. Run "firebase init" to set up Firebase project');
console.log('4. Deploy security rules: "firebase deploy --only firestore:rules,storage"');
console.log('5. Start development: "npm run dev"');
console.log('\n📞 Support: support@sidra.com');

process.exit(errors > 0 ? 1 : 0); 