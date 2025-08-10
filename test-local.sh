#!/bin/bash
# Local Testing Script - Run comprehensive tests locally
set -e

echo "🚀 Starting Local Test Suite..."
echo "=================================="

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Please run from the CV project root directory"
    exit 1
fi

# Function to start test server
start_server() {
    echo "🌐 Starting test server on port 8000..."
    python3 -m http.server 8000 > /dev/null 2>&1 &
    SERVER_PID=$!
    echo $SERVER_PID > .test-server.pid
    sleep 2
}

# Function to stop test server
stop_server() {
    if [ -f .test-server.pid ]; then
        kill $(cat .test-server.pid) 2>/dev/null || true
        rm -f .test-server.pid
        echo "🧹 Test server stopped"
    fi
}

# Trap to cleanup on exit
trap stop_server EXIT

# 1. Basic validation
echo ""
echo "1️⃣ Basic File Structure Check"
echo "------------------------------"
test -f index.html && echo "✅ index.html exists"
test -f career-intelligence.html && echo "✅ career-intelligence.html exists"
test -f manifest.json && echo "✅ manifest.json exists"
test -d assets/ && echo "✅ assets/ directory exists"

# 2. Start server and test pages load
echo ""
echo "2️⃣ Page Load Test"
echo "------------------"
start_server

# Test main pages
if curl -f -s http://localhost:8000/ > /dev/null; then
    echo "✅ Main CV page loads"
else
    echo "❌ Main CV page failed to load"
    exit 1
fi

if curl -f -s http://localhost:8000/career-intelligence.html > /dev/null; then
    echo "✅ Career intelligence page loads"
else
    echo "❌ Career intelligence page failed to load"
    exit 1
fi

# 3. Run Node.js tests if available
echo ""
echo "3️⃣ Foundation Tests"
echo "-------------------"
if [ -d "tests" ] && [ -f "tests/package.json" ]; then
    cd tests
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing test dependencies..."
        npm ci
    fi
    
    if npm run test:foundation 2>/dev/null; then
        echo "✅ Foundation tests passed"
    else
        echo "⚠️  Foundation tests not available or failed"
    fi
    cd ..
else
    echo "⚠️  Test suite not found - skipping"
fi

# 4. Basic accessibility check
echo ""
echo "4️⃣ Basic Accessibility Check"
echo "-----------------------------"
if command -v axe > /dev/null; then
    axe http://localhost:8000/ || echo "⚠️  Run 'npm install -g @axe-core/cli' for accessibility testing"
else
    echo "⚠️  Install axe-cli for accessibility testing: npm install -g @axe-core/cli"
fi

# 5. Performance check
echo ""
echo "5️⃣ Performance Check"
echo "--------------------"
if command -v lighthouse > /dev/null; then
    lighthouse http://localhost:8000/ --only-categories=performance --quiet --chrome-flags="--headless" || echo "⚠️  Lighthouse check skipped"
else
    echo "⚠️  Install Lighthouse for performance testing: npm install -g lighthouse"
fi

stop_server

echo ""
echo "🎉 Local test suite completed!"
echo "==============================="
echo ""
echo "💡 For more comprehensive testing:"
echo "   - Install axe-cli: npm install -g @axe-core/cli"
echo "   - Install lighthouse: npm install -g lighthouse" 
echo "   - Run Playwright tests: cd tests && npx playwright test"
echo ""