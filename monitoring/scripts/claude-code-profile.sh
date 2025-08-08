#!/bin/bash

# Claude Code Monitoring Profile
# Add this to your ~/.zshrc or ~/.bashrc for automatic monitoring

# Core OpenTelemetry Configuration
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# Export intervals (shorter for development, longer for production)
export OTEL_METRIC_EXPORT_INTERVAL=10000  # 10 seconds
export OTEL_LOGS_EXPORT_INTERVAL=5000     # 5 seconds

# Optional: Team/Organization identification
# Uncomment and customize for your team
# export OTEL_RESOURCE_ATTRIBUTES="department=engineering,team.id=ai-platform,cost_center=eng-ai"

# Privacy controls
export OTEL_LOG_USER_PROMPTS=0  # Set to 1 to log prompt content (be careful with sensitive data)

# Cardinality controls (adjust based on your monitoring backend capacity)
export OTEL_METRICS_INCLUDE_SESSION_ID=true
export OTEL_METRICS_INCLUDE_VERSION=false
export OTEL_METRICS_INCLUDE_ACCOUNT_UUID=true

# Convenience functions
claude-monitoring-status() {
    echo "🔍 Claude Code Monitoring Status"
    echo "================================"
    echo "Telemetry Enabled: ${CLAUDE_CODE_ENABLE_TELEMETRY:-❌ Not set}"
    echo "Metrics Exporter: ${OTEL_METRICS_EXPORTER:-❌ Not set}" 
    echo "Logs Exporter: ${OTEL_LOGS_EXPORTER:-❌ Not set}"
    echo "OTLP Endpoint: ${OTEL_EXPORTER_OTLP_ENDPOINT:-❌ Not set}"
    echo ""
    echo "🌐 Monitoring Services:"
    echo "  Grafana:    http://localhost:3000"
    echo "  Prometheus: http://localhost:9090"
    echo "  Collector:  http://localhost:8888"
}

claude-monitoring-test() {
    echo "🧪 Testing monitoring connectivity..."
    
    # Test OTLP endpoint
    if curl -s -f "${OTEL_EXPORTER_OTLP_ENDPOINT:-http://localhost:4317}" > /dev/null; then
        echo "✅ OTLP Collector reachable"
    else
        echo "❌ OTLP Collector not reachable at ${OTEL_EXPORTER_OTLP_ENDPOINT:-http://localhost:4317}"
    fi
    
    # Test web interfaces
    if curl -s -f "http://localhost:3000/api/health" > /dev/null; then
        echo "✅ Grafana healthy"
    else
        echo "❌ Grafana not healthy"
    fi
    
    if curl -s -f "http://localhost:9090/-/healthy" > /dev/null; then
        echo "✅ Prometheus healthy"  
    else
        echo "❌ Prometheus not healthy"
    fi
}

claude-monitoring-logs() {
    echo "📋 Recent Claude Code monitoring logs..."
    echo "========================================"
    cd "$(dirname "${BASH_SOURCE[0]}")/../" || return 1
    docker-compose logs --tail=20 -f
}

# Auto-check monitoring status when profile is loaded
if [[ "${CLAUDE_CODE_ENABLE_TELEMETRY}" == "1" ]]; then
    echo "✅ Claude Code monitoring enabled"
    
    # Quick connectivity check (non-blocking)
    if ! curl -s -f -m 2 "${OTEL_EXPORTER_OTLP_ENDPOINT:-http://localhost:4317}" > /dev/null 2>&1; then
        echo "⚠️  Monitoring services may not be running. Use 'claude-monitoring-test' to check."
    fi
else
    echo "💡 Run 'claude-monitoring-status' to see monitoring configuration"
fi