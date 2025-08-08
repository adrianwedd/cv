#!/bin/bash

echo "🧪 Quick Monitoring Setup Test"
echo "=============================="

cd "$(dirname "$0")/.."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker."
    exit 1
fi

echo "✅ Docker is available and running"

# Check required files
required_files=(
    "docker-compose.yml"
    "otel-collector.yml" 
    "prometheus.yml"
    "loki.yml"
    "langsmith-proxy/package.json"
    "langsmith-proxy/server.js"
    "grafana/provisioning/datasources/datasources.yml"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ Missing required file: $file"
        exit 1
    fi
done

# Check .env
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    
    # Check for LangSmith API key
    if grep -q "LANGSMITH_API_KEY=your_langsmith_api_key_here" .env; then
        echo "⚠️  Please update LANGSMITH_API_KEY in .env file"
    elif grep -q "LANGSMITH_API_KEY=" .env; then
        echo "✅ LANGSMITH_API_KEY is configured"
    else
        echo "⚠️  LANGSMITH_API_KEY not found in .env"
    fi
else
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your LangSmith API key"
fi

# Validate Docker Compose
echo "🔍 Validating Docker Compose configuration..."
if docker-compose config &> /dev/null; then
    echo "✅ Docker Compose configuration is valid"
else
    echo "❌ Docker Compose configuration has errors:"
    docker-compose config
    exit 1
fi

# Check for port conflicts
echo "🔍 Checking for port conflicts..."
ports=(3000 3100 4317 4318 8080 8888 8889 9090)
conflicts=()

for port in "${ports[@]}"; do
    if lsof -i ":$port" &> /dev/null; then
        conflicts+=($port)
    fi
done

if [ ${#conflicts[@]} -eq 0 ]; then
    echo "✅ No port conflicts detected"
else
    echo "⚠️  Port conflicts detected: ${conflicts[*]}"
    echo "   These services may conflict with the monitoring stack"
    echo "   Consider stopping conflicting services or modifying ports"
fi

echo ""
echo "🎯 Setup Test Results:"
echo "======================"
echo "✅ All required files present"
echo "✅ Docker environment ready"
echo "✅ Configuration valid"

if [ ${#conflicts[@]} -gt 0 ]; then
    echo "⚠️  Port conflicts may cause issues"
fi

if [ -f ".env" ] && ! grep -q "your_langsmith_api_key_here" .env; then
    echo "✅ Ready to start monitoring stack!"
    echo ""
    echo "Next steps:"
    echo "1. Run: ./setup.sh"
    echo "2. Configure your shell profile"
    echo "3. Start using Claude Code with monitoring"
else
    echo "📝 Please configure .env file first"
    echo ""
    echo "Required:"
    echo "1. Get LangSmith API key from https://smith.langchain.com"
    echo "2. Update LANGSMITH_API_KEY in .env file"
    echo "3. Run: ./setup.sh"
fi