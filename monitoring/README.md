# Claude Code Monitoring & LangSmith Integration

Complete monitoring infrastructure for Claude Code with OpenTelemetry metrics, Grafana dashboards, and LangSmith integration.

## 🚀 Quick Start

1. **Get LangSmith API Key**
   ```bash
   # Sign up at https://smith.langchain.com
   # Get your API key from the settings page
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your LangSmith API key
   ```

3. **Start Monitoring Stack**
   ```bash
   ./setup.sh
   ```

4. **Configure Claude Code**
   ```bash
   # Add to your ~/.zshrc or ~/.bashrc
   source /path/to/monitoring/scripts/claude-code-profile.sh
   
   # Restart terminal, then run
   claude
   ```

## 📊 Services

| Service | URL | Description |
|---------|-----|-------------|
| Grafana | http://localhost:3000 | Dashboards & Visualization (admin/admin123) |
| Prometheus | http://localhost:9090 | Metrics Storage |
| Loki | http://localhost:3100 | Logs Storage |
| OTEL Collector | http://localhost:8888 | Metrics Collection |

## 🎯 What Gets Monitored

### Metrics
- **Session Activity**: Session count, active time
- **Cost Tracking**: Usage costs by model and user
- **Token Usage**: Input/output/cache tokens with detailed breakdown
- **Productivity**: Lines of code added/removed
- **Development Impact**: Commits and PRs created

### Events (Logs)
- **User Interactions**: Prompts (optionally with content)
- **Tool Usage**: File operations, bash commands, API calls
- **API Requests**: Model calls with timing and cost
- **Errors**: Failed operations with context

### LangSmith Integration
- **Traces**: Complete interaction flows
- **Runs**: Individual Claude Code operations
- **Cost Analysis**: Token usage and cost optimization
- **Performance**: Response times and throughput

## 🔧 Configuration Options

### Environment Variables

```bash
# Core settings
CLAUDE_CODE_ENABLE_TELEMETRY=1
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp

# LangSmith integration
LANGSMITH_API_KEY=your_key_here
LANGSMITH_PROJECT=claude-code-monitoring

# Team identification
OTEL_RESOURCE_ATTRIBUTES="department=engineering,team.id=platform"

# Privacy controls
OTEL_LOG_USER_PROMPTS=0  # Set to 1 to log prompt content
```

### Cardinality Control

```bash
# Control metric dimensions (affects storage/cost)
OTEL_METRICS_INCLUDE_SESSION_ID=true   # Session-level breakdown
OTEL_METRICS_INCLUDE_VERSION=false     # Version tracking
OTEL_METRICS_INCLUDE_ACCOUNT_UUID=true # User-level tracking
```

## 📈 Dashboards

### Claude Code Overview
- Real-time session activity
- Cost monitoring by model and user
- Token usage patterns
- Code productivity metrics
- Recent errors and warnings

Access at: http://localhost:3000/d/claude-code-overview

## 🔍 Monitoring Commands

```bash
# Check monitoring status
claude-monitoring-status

# Test connectivity
claude-monitoring-test

# View logs
claude-monitoring-logs

# Stop monitoring
docker-compose down

# View metrics in console (debug)
export OTEL_METRICS_EXPORTER=console
```

## 🏢 Enterprise Configuration

### Managed Settings (Administrator)
```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "http://collector.company.com:4317",
    "OTEL_EXPORTER_OTLP_HEADERS": "Authorization=Bearer company-token"
  }
}
```

Locations:
- macOS: `/Library/Application Support/ClaudeCode/managed-settings.json`
- Linux: `/etc/claude-code/managed-settings.json`
- Windows: `C:\ProgramData\ClaudeCode\managed-settings.json`

### Multi-Team Setup
```bash
# Team-specific resource attributes
OTEL_RESOURCE_ATTRIBUTES="team.id=platform,cost_center=eng-123,department=engineering"
```

## 🔐 Security & Privacy

- **Opt-in Only**: Telemetry disabled by default
- **No Sensitive Data**: API keys, file contents never collected
- **Prompt Privacy**: User prompts redacted by default
- **Local Control**: All data stays in your infrastructure
- **Audit Trail**: Complete logging of what's collected

## 🚨 Alerting

### Prometheus Alert Rules
Create `prometheus/rules/claude-code.yml`:

```yaml
groups:
  - name: claude-code-alerts
    rules:
      - alert: HighCostUsage
        expr: increase(claude_code_cost_usage_total[1h]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High Claude Code cost usage detected"
          
      - alert: LowSuccessRate
        expr: rate(claude_code_api_errors_total[5m]) / rate(claude_code_api_requests_total[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Claude Code API error rate above 10%"
```

## 🔄 Maintenance

### Log Rotation
```bash
# Rotate logs weekly
docker-compose exec loki sh -c "find /loki -name '*.gz' -mtime +7 -delete"
```

### Backup
```bash
# Backup Prometheus data
docker run --rm -v monitoring_prometheus_data:/source -v $(pwd)/backups:/backup alpine tar czf /backup/prometheus-$(date +%Y%m%d).tar.gz -C /source .
```

### Updates
```bash
# Update to latest versions
docker-compose pull
docker-compose up -d
```

## 🎓 LangSmith Integration Details

### Data Flow
1. Claude Code → OpenTelemetry → Collector → LangSmith Proxy → LangSmith
2. Metrics become LangSmith "runs" with cost/performance metadata  
3. Logs become structured events with full context
4. Traces show complete interaction flows

### LangSmith Features
- **Project Organization**: Separate environments (dev/staging/prod)
- **Cost Analysis**: Token usage optimization recommendations
- **Performance Tracking**: Response time trends
- **Debugging**: Detailed error traces with context
- **Collaboration**: Team dashboards and shared insights

## 🐛 Troubleshooting

### Common Issues

**Services not starting:**
```bash
docker-compose logs
# Check for port conflicts, permission issues
```

**No data in Grafana:**
```bash
# Check OTEL collector logs
docker-compose logs otel-collector

# Verify Claude Code config
claude-monitoring-status
```

**LangSmith not receiving data:**
```bash
# Check proxy logs
docker-compose logs langsmith-proxy

# Verify API key
curl -H "Authorization: Bearer $LANGSMITH_API_KEY" https://api.smith.langchain.com/projects
```

### Log Locations
- Collector: `logs/otel/`
- Prometheus: Container `/prometheus`
- Grafana: Container `/var/lib/grafana`
- Loki: Container `/loki`

## 📚 Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Claude Code Monitoring Guide](https://docs.anthropic.com/claude-code/monitoring-usage)
- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [Grafana Dashboard Examples](https://grafana.com/grafana/dashboards/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Test with `./scripts/test-monitoring.sh`
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.