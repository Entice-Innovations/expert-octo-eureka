import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),

  // General JavaScript rules
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },

  // React frontend
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },

  // Node.js backend
  {
    files: ['backend/**/*.{js,cjs,mjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Root-level Node.js configuration files
  {
    files: ['*.config.{js,cjs,mjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
])