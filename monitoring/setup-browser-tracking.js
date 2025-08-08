#!/usr/bin/env node

/**
 * Setup Browser Tracking for LangSmith Integration
 * Adds tracking script to index.html and prepares monitoring infrastructure
 */

const fs = require('fs');
const path = require('path');

class BrowserTrackingSetup {
    constructor() {
        this.indexPath = path.join(__dirname, '../index.html');
        this.trackingScriptPath = path.join(__dirname, 'browser-tracking.js');
    }

    async setup() {
        console.log('🔧 Setting up LangSmith Browser Tracking');
        console.log('=======================================\n');

        await this.checkFiles();
        await this.backupIndex();
        await this.injectTrackingScript();
        await this.generateInstructions();
        
        console.log('✅ Browser tracking setup completed!');
    }

    async checkFiles() {
        console.log('1️⃣ Checking required files...');
        
        if (!fs.existsSync(this.indexPath)) {
            throw new Error(`index.html not found at: ${this.indexPath}`);
        }
        
        if (!fs.existsSync(this.trackingScriptPath)) {
            throw new Error(`browser-tracking.js not found at: ${this.trackingScriptPath}`);
        }
        
        console.log('   ✅ index.html found');
        console.log('   ✅ browser-tracking.js found');
    }

    async backupIndex() {
        console.log('\\n2️⃣ Creating backup...');
        
        const backupPath = `${this.indexPath}.backup.${Date.now()}`;
        fs.copyFileSync(this.indexPath, backupPath);
        
        console.log(`   ✅ Backup created: ${path.basename(backupPath)}`);
    }

    async injectTrackingScript() {
        console.log('\\n3️⃣ Injecting tracking script...');
        
        let html = fs.readFileSync(this.indexPath, 'utf8');
        
        // Check if tracking is already injected
        if (html.includes('LangSmith Tracking')) {
            console.log('   ⚠️  Tracking script already present');
            return;
        }
        
        // Read tracking script
        const trackingScript = fs.readFileSync(this.trackingScriptPath, 'utf8');
        
        // Create script tag with inline content
        const scriptTag = `
<!-- LangSmith Tracking Integration -->
<script>
${trackingScript}
</script>
<!-- End LangSmith Tracking -->`;
        
        // Inject before closing body tag
        if (html.includes('</body>')) {
            html = html.replace('</body>', `${scriptTag}\n</body>`);
        } else {
            // Fallback: inject before closing html tag
            html = html.replace('</html>', `${scriptTag}\n</html>`);
        }
        
        // Write updated HTML
        fs.writeFileSync(this.indexPath, html);
        
        console.log('   ✅ Tracking script injected into index.html');
    }

    async generateInstructions() {
        console.log('\\n4️⃣ Generating setup instructions...');
        
        const instructions = `
# LangSmith Browser Tracking - Setup Complete

## ✅ What was done:
1. Backup created of original index.html
2. Browser tracking script injected into index.html
3. Tracking will automatically capture:
   - Page views and navigation
   - User interactions (clicks, scrolls)
   - Performance metrics (load times, Core Web Vitals)
   - External link clicks
   - File downloads
   - Session analytics

## 🚀 Next Steps:

### 1. Fix API Key (CRITICAL)
The current LangSmith API key appears to be invalid/expired.

\`\`\`bash
# Visit LangSmith settings to generate new API key
open "https://smith.langchain.com/settings"

# Update .env.langsmith with new key
echo "LANGSMITH_API_KEY=your_new_key_here" > .env.langsmith
\`\`\`

### 2. Start LangSmith Proxy
\`\`\`bash
cd monitoring/langsmith-proxy
npm start
\`\`\`

### 3. Test Integration
\`\`\`bash
cd monitoring
node langsmith-diagnostics.js
\`\`\`

### 4. Deploy with Docker (Optional)
\`\`\`bash
cd monitoring
docker-compose up -d
\`\`\`

## 📊 Monitoring Dashboard
Once API key is fixed, view your data at:
https://smith.langchain.com/o/adrianwedd/projects/p/adrianwedd-cv

## 🔧 Configuration
Edit monitoring/browser-tracking.js to customize:
- Tracking endpoints
- Event filtering
- Debug mode
- Sampling rates

## 🧪 Testing
Open your CV website and check browser console for tracking events.
All interactions will be automatically sent to LangSmith via the proxy.

## ⚠️ Important Notes
- The tracking script is now inline in index.html for reliability
- Proxy must be running on localhost:8080 for browser tracking to work
- Valid LangSmith API key is required for data to appear in dashboard
- All tracking is privacy-focused (no PII collected)

## 🆘 Troubleshooting
Run diagnostics if data isn't appearing:
\`\`\`bash
cd monitoring
node langsmith-diagnostics.js
\`\`\`

Created: ${new Date().toISOString()}
        `;
        
        const instructionsPath = path.join(__dirname, 'BROWSER_TRACKING_SETUP.md');
        fs.writeFileSync(instructionsPath, instructions.trim());
        
        console.log('   ✅ Instructions saved to BROWSER_TRACKING_SETUP.md');
    }
}

// CLI execution
if (require.main === module) {
    const setup = new BrowserTrackingSetup();
    setup.setup().catch(error => {
        console.error('\\n💥 Setup failed:', error.message);
        process.exit(1);
    });
}

module.exports = { BrowserTrackingSetup };