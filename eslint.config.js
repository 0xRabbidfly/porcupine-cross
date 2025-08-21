import js from '@eslint/js';
import jestPlugin from 'eslint-plugin-jest';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  // Global ignores must come first
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', '**/*.min.js'],
  },
  {
    // Only target JavaScript files in specific directories
    files: ['js/**/*.js', 'scripts/**/*.js', 'tests/**/*.js', '*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      // All browser globals defined here - no inline declarations
      globals: {
        // DOM and Browser APIs
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',

        // Timers
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',

        // Animation
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',

        // Events
        Event: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',

        // Other Browser APIs
        Promise: 'readonly',
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        HTMLElement: 'readonly',
        NodeList: 'readonly',
        Node: 'readonly',
        Element: 'readonly',
        gtag: 'readonly',
      },
    },
    rules: {
      // Only allow console.warn, console.error, console.info
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'warn',
    },
  },
  {
    // Test-specific configuration
    files: ['tests/**/*.js'],
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: {
      globals: {
        // Jest globals
        jest: 'readonly',
        expect: 'readonly',
        test: 'readonly',
        describe: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        global: 'readonly',

        // Additional test globals (already include browser globals from above)
      },
    },
    rules: {
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      // More lenient console rules for tests
      'no-console': 'off',
    },
  },
  prettier,
];
