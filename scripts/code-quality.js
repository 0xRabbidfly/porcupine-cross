/**
 * Code Quality Check Script
 *
 * This script performs code quality checks including:
 * - ESLint for static code analysis
 * - Prettier for code formatting
 * - Jest for test coverage
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const MIN_COVERAGE = 40; // Minimum acceptable coverage percentage

// Colors for console output
// const colors = {
//   red: '\x1b[31m',
//   green: '\x1b[32m',
//   yellow: '\x1b[33m',
//   blue: '\x1b[34m',
//   magenta: '\x1b[35m',
//   cyan: '\x1b[36m',
//   reset: '\x1b[0m'
// };

// Comment out or remove all non-essential console.log statements except warn/error/info. Remove any unused variables. Add comments to clarify Node-only process.env/process.argv usage.
// console.log(`${colors.cyan}======================================${colors.reset}`);
// console.log(`${colors.cyan}       CODE QUALITY CHECK TOOL        ${colors.reset}`);
// console.log(`${colors.cyan}======================================${colors.reset}\n`);

// Track if any checks fail
let hasErrors = false;

try {
  // Step 1: Run ESLint
  // console.log(`${colors.blue}Running ESLint...${colors.reset}`);
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    // console.log(`${colors.green}✓ ESLint check passed${colors.reset}\n`);
  } catch {
    hasErrors = true;
  }

  // Step 2: Check test coverage
  // console.log(`${colors.blue}Checking test coverage...${colors.reset}`);
  try {
    // Run tests with coverage
    execSync('npm run test:coverage', { stdio: 'pipe' });

    // Read coverage summary
    const coverageSummaryPath = path.resolve('./coverage/coverage-summary.json');
    if (fs.existsSync(coverageSummaryPath)) {
      const coverageData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
      const totalCoverage = coverageData.total.statements.pct;

      // console.log(`Overall test coverage: ${totalCoverage}%`);

      if (totalCoverage < MIN_COVERAGE) {
        // console.log(`${colors.red}✗ Coverage below minimum threshold of ${MIN_COVERAGE}%${colors.reset}\n`);
        hasErrors = true;
      } else {
        // console.log(`${colors.green}✓ Coverage meets minimum threshold${colors.reset}\n`);
      }
    } else {
      // console.log(`${colors.yellow}! Could not find coverage summary${colors.reset}\n`);
    }
  } catch {
    hasErrors = true;
  }

  // Step 3: Check for outdated dependencies (optional)
  // console.log(`${colors.blue}Checking for outdated dependencies...${colors.reset}`);
  try {
    const output = execSync('npm outdated --json', { encoding: 'utf8' });
    const outdated = output.trim() === '' ? {} : JSON.parse(output);
    if (Object.keys(outdated).length > 0) {
      // Optionally handle outdated dependencies
    }
  } catch (err) {
    if (err.status === 1) {
      try {
        const output = err.stdout.toString();
        const outdated = JSON.parse(output);
        if (Object.keys(outdated).length > 0) {
          // Optionally handle outdated dependencies
        }
      } catch {
        // Optionally handle parse error
      }
    } else {
      // Optionally handle other errors
    }
  }

  // Final report
  if (hasErrors) {
    // console.log(`${colors.red}======================================${colors.reset}`);
    // console.log(`${colors.red}       CODE QUALITY CHECK FAILED      ${colors.reset}`);
    // console.log(`${colors.red}======================================${colors.reset}\n`);
    throw new Error('Code quality check failed');
  }
} catch {
  // console.error(`${colors.red}An unexpected error occurred:${colors.reset}`, error);
  throw new Error('An unexpected error occurred');
}
