import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['dist', 'node_modules', 'coverage', 'build'] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.node,
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    'argsIgnorePattern': '^_'
                }
            ],
            'no-console': [
                'warn',
                {
                    'allow': [
                        'warn',
                        'error',
                        'info'
                    ]
                }
            ]
        },
    },
    {
        files: ['scripts/**/*.ts'],
        rules: {
            'no-console': 'off',
            '@typescript-eslint/no-explicit-any': 'off'
        }
    },
    {
        files: ['prisma/**/*.ts'],
        rules: {
            'no-console': 'off',
            '@typescript-eslint/no-unused-vars': 'off'
        }
    },
    {
        files: ['tests/**/*.ts'],
        rules: {
            'no-console': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'off'
        }
    }
);
