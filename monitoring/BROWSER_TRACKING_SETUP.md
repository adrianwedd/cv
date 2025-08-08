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

```bash
# Visit LangSmith settings to generate new API key
open "https://smith.langchain.com/settings"

# Update .env.langsmith with new key
echo "LANGSMITH_API_KEY=your_new_key_here" > .env.langsmith
```

### 2. Start LangSmith Proxy
```bash
cd monitoring/langsmith-proxy
npm start
```

### 3. Test Integration
```bash
cd monitoring
node langsmith-diagnostics.js
```

### 4. Deploy with Docker (Optional)
```bash
cd monitoring
docker-compose up -d
```

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
```bash
cd monitoring
node langsmith-diagnostics.js
```

Created: 2025-08-08T15:19:55.040Z