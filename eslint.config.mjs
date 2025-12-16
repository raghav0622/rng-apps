// eslint.config.mjs
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintPluginImport from 'eslint-plugin-import';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  // 1. Next.js Base Configurations
  ...nextVitals,
  ...nextTs,

  // 2. Custom Rules and Plugins for DX Mandates
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      import: eslintPluginImport,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'no-console': 'error',
      '@next/next/no-img-element': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '*.config.js',
    '*.config.ts',
    '*.config.mjs',
  ]),
]);

export default eslintConfig;
