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
    // ADR-003: the shipped application never parses formulas at runtime.
    files: ['packages/engine/src/**/*.ts'],
    rules: {
      'no-eval': 'error',
      'no-new-func': 'error',
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
      globals: { document: 'readonly', window: 'readonly' },
    },
  },
);
