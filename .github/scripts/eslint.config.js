export default [
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                // Node.js globals
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
                clearInterval: 'readonly',
                
                // Browser globals for Puppeteer and browser automation scripts
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                location: 'readonly',
                history: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                
                // Web APIs
                fetch: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                FormData: 'readonly',
                XMLHttpRequest: 'readonly',
                WebSocket: 'readonly',
                
                // Common test globals
                test: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                expect: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                
                // Other potentially undefined globals
                crypto: 'readonly',
                TextEncoder: 'readonly',
                TextDecoder: 'readonly',
                btoa: 'readonly',
                atob: 'readonly',
                
                // Additional Node.js and CI globals
                performance: 'readonly',
                IntelligenceOrchestrator: 'readonly',
                ClaudeAuthManager: 'readonly',
                nameWithOwner: 'readonly',
                
                // Common ES modules and Node.js globals
                __dirname: 'readonly',
                __filename: 'readonly'
            }
        },
        rules: {
            // Disable rules that are too strict for scripts
            'no-console': 'off',
            'no-process-exit': 'off',
            'no-unused-vars': 'off', // Too noisy for CI - disable for now
            'no-undef': 'error', // Keep this as error for real issues
            
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