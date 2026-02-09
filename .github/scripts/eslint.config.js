module.exports = [
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                global: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly'
            }
        },
        rules: {
            // Disable rules that are too strict for scripts
            'no-console': 'off',
            'no-process-exit': 'off',
            'no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrors: 'none'
            }],
            'no-undef': 'warn',
            
            // Less strict formatting for existing code  
            'quotes': 'off',
            'semi': 'off',
            'comma-dangle': 'off',
            'indent': 'off',
            'no-trailing-spaces': 'off',
            'eol-last': 'off',
            
            // Keep important error checks
            'no-var': 'error',
            'no-unreachable': 'error',
            'no-redeclare': 'error'
        }
    }
];