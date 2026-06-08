import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
  {
    ignores: ['dist/**', 'coverage/**'],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        document: 'readonly',
      },
    },
  },
]
