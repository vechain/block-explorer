import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'
import i18next from 'eslint-plugin-i18next'
import react from 'eslint-plugin-react'

const config = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'public/**',
      'terraform/**',
      '.claude/**',
      '**/*.config.js',
      '**/*.config.ts',
      'next-env.d.ts',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  react.configs.flat.recommended,
  prettier,
  {
    // eslint-plugin-react 7.37.5 still declares eslint <=9, and its version sniffing
    // calls a context API eslint 10 removed, so pin the version instead of detecting.
    settings: { react: { version: '19.2' } },
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    plugins: { i18next },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { allow: ['group', 'groupEnd', 'warn', 'error'] }],
      'i18next/no-literal-string': [
        'error',
        {
          mode: 'jsx-text-only',
          'jsx-attributes': { include: [], exclude: ['.*'] },
        },
      ],
    },
  },
  {
    // Node tooling, not app code: printing to stdout is the whole point.
    files: ['scripts/**'],
    rules: { 'no-console': 'off' },
  },
]

export default config
