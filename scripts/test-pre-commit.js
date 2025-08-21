#!/usr/bin/env node

/**
 * Test Pre-commit Hook Script
 *
 * This script helps test the pre-commit hook by:
 * 1. Making a small test change
 * 2. Running the pre-commit hook manually
 * 3. Reverting the change
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

const testFile = 'package.json';

console.info('🧪 Testing pre-commit hook...\n');

try {
  // Read current content
  const originalContent = readFileSync(testFile, 'utf8');

  // Add a harmless JSON property to trigger the hook
  const modifiedContent = originalContent.replace(
    '  "keywords": [],',
    '  "keywords": [],\n  "test-pre-commit": true,'
  );

  // Write the test change
  writeFileSync(testFile, modifiedContent);
  console.info('✅ Made test change to package.json');

  // Stage the change
  execSync('git add package.json', { stdio: 'inherit' });
  console.info('✅ Staged test change');

  // Run pre-commit hook manually
  console.info('\n🔄 Running pre-commit hook...\n');
  execSync('npm run pre-commit', { stdio: 'inherit' });

  console.info('\n✅ Pre-commit hook passed!');

  // Revert the test change
  writeFileSync(testFile, originalContent);
  execSync('git add package.json', { stdio: 'inherit' });

  console.info('✅ Reverted test change');
  console.info('\n🎉 Pre-commit hook is working correctly!');
} catch (error) {
  console.error('\n❌ Pre-commit hook failed:', error.message);

  // Try to revert the change
  try {
    const currentContent = readFileSync(testFile, 'utf8');
    const revertedContent = currentContent.replace(/\n {2}"test-pre-commit": true,/, '');
    writeFileSync(testFile, revertedContent);
    execSync('git add package.json', { stdio: 'inherit' });
    console.info('✅ Reverted test change');
  } catch (revertError) {
    console.error('❌ Failed to revert test change:', revertError.message);
  }

  // eslint-disable-next-line no-undef
  process.exit(1);
}
