#!/bin/bash

echo "🚀 Claude Code + LangSmith Monitoring Setup"
echo "==========================================="

# Navigate to monitoring directory
cd "$(dirname "$0")/monitoring" || exit 1

# Run the setup test first
echo "🧪 Running pre-setup validation..."
if ! ./scripts/quick-setup-test.sh; then
    echo "❌ Pre-setup validation failed. Please fix issues above."
    exit 1
fi

echo ""
echo "✅ Pre-setup validation passed!"
echo ""

# Check if .env is configured
if [ -f .env ] && grep -q "your_langsmith_api_key_here" .env; then
    echo "⚠️  LangSmith API Key Configuration Required"
    echo "=========================================="
    echo ""
    echo "1. Visit: https://smith.langchain.com"
    echo "2. Sign up or log in"  
    echo "3. Go to Settings → API Keys"
    echo "4. Create a new API key"
    echo "5. Copy the key"
    echo ""
    echo "Enter your LangSmith API key:"
    read -r api_key
    
    if [ -n "$api_key" ]; then
        # Update .env file
        sed -i.bak "s/your_langsmith_api_key_here/$api_key/" .env
        echo "✅ LangSmith API key configured"
    else
        echo "❌ No API key provided. Exiting..."
        exit 1
    fi
fi

echo ""
echo "🚀 Starting monitoring infrastructure..."
echo "======================================="

# Run the main setup
if ./setup.sh; then
    echo ""
    echo "🎉 SUCCESS: Claude Code monitoring is now set up!"
    echo "================================================"
    echo ""
    echo "📖 Next Steps:"
    echo "1. Add this to your shell profile (~/.zshrc or ~/.bashrc):"
    echo ""
    echo "   source $(pwd)/scripts/claude-code-profile.sh"
    echo ""
    echo "2. Restart your terminal"
    echo ""
    echo "3. Test with: claude-monitoring-status"
    echo ""
    echo "4. Start using Claude Code - monitoring data will appear in:"
    echo "   📊 Grafana: http://localhost:3000 (admin/admin123)"
    echo "   🔍 LangSmith: https://smith.langchain.com"
    echo ""
    echo "🔧 Available commands after shell restart:"
    echo "   claude-monitoring-status  # Check configuration"
    echo "   claude-monitoring-test    # Test connectivity"  
    echo "   claude-monitoring-logs    # View logs"
    echo ""
    echo "📚 Documentation: ./monitoring/README.md"
else
    echo "❌ Setup failed. Check logs above for errors."
    exit 1
fi