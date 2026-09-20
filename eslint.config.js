import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default defineConfig([
  { ignores: ['dist', 'src/vendor'] },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { js },
    extends: ['js/recommended'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: { globals: globals.browser },
  },
  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    settings: {
      react: {
        // 从 package.json 自动检测 React 版本
        version: 'detect',
      },
    },
  },
  {
    rules: {
      'no-unused-vars': 'off', // 关闭未使用变量的检查
      'react-refresh/only-export-components': 'off',
      'react/display-name': 'off',
      // 约束js使用单引号，允许jsx双引号
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'jsx-quotes': ['error', 'prefer-double'],
      'react-hooks/exhaustive-deps': 'off',
      'react/react-in-jsx-scope': 'off',
      // 禁止使用 any 类型
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]);
