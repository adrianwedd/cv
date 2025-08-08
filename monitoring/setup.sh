#!/bin/bash

set -e

echo "🚀 Setting up Claude Code Monitoring Infrastructure"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before continuing."
    echo "   Required: LANGSMITH_API_KEY"
    echo "   Optional: LANGSMITH_PROJECT, team identifiers"
    echo ""
    echo "Continue setup? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. Please configure .env and run setup again."
        exit 0
    fi
fi

# Load environment variables
set -a
source .env
set +a

# Validate required environment variables
if [ -z "$LANGSMITH_API_KEY" ] || [ "$LANGSMITH_API_KEY" = "your_langsmith_api_key_here" ]; then
    echo "❌ LANGSMITH_API_KEY is required. Please set it in .env file."
    exit 1
fi

echo "✅ Environment configuration loaded"

# Create necessary directories
mkdir -p logs
mkdir -p prometheus/rules

echo "📁 Created monitoring directories"

# Build the LangSmith proxy
echo "🔨 Building LangSmith proxy..."
cd langsmith-proxy
npm install
cd ..

echo "🚀 Starting monitoring infrastructure..."

# Start the stack
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

services=("prometheus:9090" "grafana:3000" "loki:3100" "langsmith-proxy:8080" "otel-collector:8888")
all_healthy=true

for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if curl -sf "http://localhost:$port/health" > /dev/null 2>&1 || curl -sf "http://localhost:$port" > /dev/null 2>&1; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name is not responding"
        all_healthy=false
    fi
done

if [ "$all_healthy" = true ]; then
    echo ""
    echo "🎉 Claude Code Monitoring Setup Complete!"
    echo "========================================"
    echo ""
    echo "📊 Services Available:"
    echo "   Grafana:     http://localhost:3000 (admin/admin123)"
    echo "   Prometheus:  http://localhost:9090"
    echo "   Loki:        http://localhost:3100"
    echo "   OTEL Collector: http://localhost:8888/metrics"
    echo ""
    echo "🔧 Claude Code Configuration:"
    echo "   Add these to your shell profile (~/.zshrc, ~/.bashrc):"
    echo ""
    echo "   export CLAUDE_CODE_ENABLE_TELEMETRY=1"
    echo "   export OTEL_METRICS_EXPORTER=otlp"
    echo "   export OTEL_LOGS_EXPORTER=otlp"
    echo "   export OTEL_EXPORTER_OTLP_PROTOCOL=grpc"
    echo "   export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317"
    echo "   export OTEL_METRIC_EXPORT_INTERVAL=10000"
    echo "   export OTEL_LOGS_EXPORT_INTERVAL=5000"
    echo ""
    echo "   Then restart your terminal and run: claude"
    echo ""
    echo "📈 LangSmith Integration:"
    echo "   Project: $LANGSMITH_PROJECT"
    echo "   Data will appear in LangSmith after Claude Code usage"
    echo ""
    echo "🔍 View logs with: docker-compose logs -f"
else
    echo ""
    echo "⚠️  Some services are not healthy. Check logs with:"
    echo "   docker-compose logs"
fi