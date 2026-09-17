import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'docs/**',
      'packages/app/src/locale/generated/**',
      'packages/engine/src/formulas/generated/**',
      'packages/engine/src/variables/generated/**',
      'packages/engine/test/golden/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'],
      'no-console': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs', 'packages/codegen/src/**/*.ts'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly' },
    },
  },
  {
    files: ['packages/engine/src/**/*.ts'],
    rules: {
      // ADR-003: the shipped application never parses formulas at runtime.
      'no-eval': 'error',
      'no-new-func': 'error',
      // ADR-002: the engine imports nothing from Node, the DOM or React, which is what keeps it
      // testable in Node and readable by a reviewer who does not want to read interface code.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['node:*', 'fs', 'path', 'os', 'crypto'],
              message: 'ADR-002: the engine holds no Node import.',
            },
            {
              group: ['react', 'react-dom', 'react/*'],
              message: 'ADR-002: the engine holds no React import.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/ui/**/*.tsx', 'packages/app/**/*.tsx'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        document: 'readonly',
        window: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLDivElement: 'readonly',
        Element: 'readonly',
        KeyboardEvent: 'readonly',
        React: 'readonly',
      },
    },
    rules: {
      // P10, offline is the default: the desktop build performs no network request of any kind.
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'The application makes no network request (principle P10).' },
        {
          name: 'XMLHttpRequest',
          message: 'The application makes no network request (principle P10).',
        },
      ],
    },
  },
  {
    files: ['packages/ui/**/*.ts', 'packages/app/**/*.ts'],
    languageOptions: {
      globals: {
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        indexedDB: 'readonly',
        crypto: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        IDBRequest: 'readonly',
        IDBDatabase: 'readonly',
        IDBObjectStore: 'readonly',
        IDBTransactionMode: 'readonly',
      },
    },
  },
  {
    // The service worker runs in its own global scope, and the precache list is written into it at
    // build time by the plugin in vite.config.ts.
    files: ['packages/app/public/sw.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        caches: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        __PRECACHE__: 'readonly',
      },
    },
    rules: { 'no-undef': 'error' },
  },
  {
    // Node scripts: the static server for the end to end suite, and the content lint.
    files: ['packages/app/e2e/**/*.mjs', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: { process: 'readonly', URL: 'readonly', console: 'readonly' },
    },
  },
);
