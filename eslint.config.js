import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
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
);
