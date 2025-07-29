module.exports = {
    env: {
        node: true,
        es2022: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'commonjs'
    },
    rules: {
        // Disable rules that are too strict for scripts
        'no-console': 'off',
        'no-process-exit': 'off',
        'no-unused-vars': 'warn',
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
};