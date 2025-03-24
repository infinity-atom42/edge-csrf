import { defineConfig } from 'eslint/config'

import tseslint from 'typescript-eslint'

export default defineConfig([
	tseslint.configs.recommended,
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: './tsconfig.json',
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
		},
		rules: {
			// TypeScript rules
			'@typescript-eslint/naming-convention': 'off',
			'@typescript-eslint/no-explicit-any': 'off',

			// Core ESLint rules
			'max-classes-per-file': 'off',
			'max-len': 'off',
			'no-await-in-loop': 'off',
			'no-restricted-syntax': 'off',
			'no-underscore-dangle': 'off',
			'object-curly-newline': 'off',
		},
	},
])
