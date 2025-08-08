#!/bin/bash

set -e

echo "🧪 Testing Claude Code Monitoring Setup"
echo "======================================="

# Load environment variables
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Test OpenTelemetry Collector
echo "🔍 Testing OpenTelemetry Collector..."

# Send test metrics
curl -X POST http://localhost:4318/v1/metrics \
  -H "Content-Type: application/json" \
  -d '{
    "resourceMetrics": [{
      "resource": {
        "attributes": {
          "service.name": "claude-code-test",
          "service.version": "1.0.0"
        }
      },
      "scopeMetrics": [{
        "scope": {
          "name": "claude-code-test"
        },
        "metrics": [{
          "name": "test_metric",
          "description": "A test metric",
          "unit": "1",
          "sum": {
            "dataPoints": [{
              "value": 42,
              "timeUnixNano": "'$(date +%s)'000000000",
              "attributes": {
                "test": "true"
              }
            }],
            "aggregationTemporality": 2,
            "isMonotonic": true
          }
        }]
      }]
    }]
  }'

echo "✅ Test metrics sent"

# Send test logs
curl -X POST http://localhost:4318/v1/logs \
  -H "Content-Type: application/json" \
  -d '{
    "resourceLogs": [{
      "resource": {
        "attributes": {
          "service.name": "claude-code-test"
        }
      },
      "scopeLogs": [{
        "scope": {
          "name": "claude-code-test"
        },
        "logRecords": [{
          "timeUnixNano": "'$(date +%s)'000000000",
          "body": "Test log message",
          "attributes": {
            "event.name": "test_event",
            "level": "info"
          }
        }]
      }]
    }]
  }'

echo "✅ Test logs sent"

# Test LangSmith proxy
echo "🔍 Testing LangSmith proxy..."
curl -f http://localhost:8080/health || echo "❌ LangSmith proxy not responding"

# Test Prometheus
echo "🔍 Testing Prometheus..."
curl -f http://localhost:9090/-/healthy || echo "❌ Prometheus not healthy"

# Test Grafana
echo "🔍 Testing Grafana..."
curl -f http://localhost:3000/api/health || echo "❌ Grafana not healthy"

# Test Loki
echo "🔍 Testing Loki..."
curl -f http://localhost:3100/ready || echo "❌ Loki not ready"

echo ""
echo "✅ Monitoring test completed"
echo ""
echo "📊 Next steps:"
echo "1. Configure your shell with OpenTelemetry environment variables"
echo "2. Run Claude Code with monitoring enabled"
echo "3. Check Grafana dashboards at http://localhost:3000"
echo "4. Verify data in LangSmith project: $LANGSMITH_PROJECT"