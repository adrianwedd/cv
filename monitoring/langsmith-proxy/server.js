const express = require('express');
const cors = require('cors');
const winston = require('winston');
const { Client } = require('langsmith');

const app = express();
const port = process.env.PORT || 8080;

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'langsmith-proxy' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize LangSmith client
const langsmithClient = new Client({
  apiKey: process.env.LANGSMITH_API_KEY,
  apiUrl: process.env.LANGSMITH_ENDPOINT || process.env.LANGSMITH_API_URL || 'https://api.smith.langchain.com'
});

const projectName = process.env.LANGSMITH_PROJECT || 'adrianwedd-cv';
const tracingEnabled = process.env.LANGSMITH_TRACING === 'true';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Claude Code metrics to LangSmith conversion
app.post('/v1/metrics', async (req, res) => {
  try {
    const { resourceMetrics } = req.body;
    
    if (!resourceMetrics || !Array.isArray(resourceMetrics)) {
      return res.status(400).json({ error: 'Invalid metrics format' });
    }

    for (const resourceMetric of resourceMetrics) {
      const { resource, scopeMetrics } = resourceMetric;
      
      for (const scopeMetric of scopeMetrics) {
        const { metrics } = scopeMetric;
        
        for (const metric of metrics) {
          await processMetricForLangSmith(metric, resource);
        }
      }
    }

    res.json({ success: true, processed: resourceMetrics.length });
  } catch (error) {
    logger.error('Error processing metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process Claude Code events/logs
app.post('/v1/logs', async (req, res) => {
  try {
    const { resourceLogs } = req.body;
    
    if (!resourceLogs || !Array.isArray(resourceLogs)) {
      return res.status(400).json({ error: 'Invalid logs format' });
    }

    for (const resourceLog of resourceLogs) {
      const { resource, scopeLogs } = resourceLog;
      
      for (const scopeLog of scopeLogs) {
        const { logRecords } = scopeLog;
        
        for (const logRecord of logRecords) {
          await processLogForLangSmith(logRecord, resource);
        }
      }
    }

    res.json({ success: true, processed: resourceLogs.length });
  } catch (error) {
    logger.error('Error processing logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Convert Claude Code traces to LangSmith
app.post('/v1/traces', async (req, res) => {
  try {
    const { resourceSpans } = req.body;
    
    if (!resourceSpans || !Array.isArray(resourceSpans)) {
      return res.status(400).json({ error: 'Invalid traces format' });
    }

    for (const resourceSpan of resourceSpans) {
      const { resource, scopeSpans } = resourceSpan;
      
      for (const scopeSpan of scopeSpans) {
        const { spans } = scopeSpan;
        
        for (const span of spans) {
          await processSpanForLangSmith(span, resource);
        }
      }
    }

    res.json({ success: true, processed: resourceSpans.length });
  } catch (error) {
    logger.error('Error processing traces:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function processMetricForLangSmith(metric, resource) {
  try {
    const { name, unit, description, sum, gauge } = metric;
    const resourceAttributes = resource?.attributes || {};
    
    // Convert metrics to LangSmith format
    const langsmithData = {
      project_name: projectName,
      name: `claude_code.${name}`,
      run_type: 'llm',
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      extra: {
        metric_name: name,
        metric_unit: unit,
        metric_description: description,
        value: sum?.dataPoints?.[0]?.value || gauge?.dataPoints?.[0]?.value || 0,
        resource_attributes: resourceAttributes
      },
      tags: [
        'claude-code',
        'monitoring',
        'metrics'
      ]
    };

    // Add user and session context if available
    if (resourceAttributes['user.account_uuid']) {
      langsmithData.extra.user_id = resourceAttributes['user.account_uuid'];
      langsmithData.tags.push(`user:${resourceAttributes['user.account_uuid']}`);
    }
    
    if (resourceAttributes['session.id']) {
      langsmithData.extra.session_id = resourceAttributes['session.id'];
      langsmithData.tags.push(`session:${resourceAttributes['session.id']}`);
    }

    await langsmithClient.createRun(langsmithData);
    logger.info(`Sent metric ${name} to LangSmith`);
    
  } catch (error) {
    logger.error(`Error processing metric ${metric.name}:`, error);
  }
}

async function processLogForLangSmith(logRecord, resource) {
  try {
    const { attributes, body, timeUnixNano } = logRecord;
    const resourceAttributes = resource?.attributes || {};
    
    // Convert specific Claude Code events
    const eventName = attributes?.['event.name'];
    
    if (['user_prompt', 'tool_result', 'api_request', 'api_error', 'tool_decision'].includes(eventName)) {
      const langsmithData = {
        project_name: projectName,
        name: eventName,
        run_type: getRunTypeFromEvent(eventName),
        start_time: new Date(timeUnixNano / 1000000).toISOString(),
        end_time: new Date(timeUnixNano / 1000000).toISOString(),
        inputs: {
          event_type: eventName,
          ...attributes
        },
        outputs: {
          body: body,
          resource_attributes: resourceAttributes
        },
        extra: {
          original_log: logRecord
        },
        tags: [
          'claude-code',
          'events',
          eventName
        ]
      };

      // Add specific handling for different event types
      switch (eventName) {
        case 'user_prompt':
          langsmithData.inputs.prompt_length = attributes?.prompt_length || 0;
          if (attributes?.prompt) {
            langsmithData.inputs.prompt = attributes.prompt;
          }
          break;
          
        case 'tool_result':
          langsmithData.inputs.tool_name = attributes?.tool_name;
          langsmithData.inputs.success = attributes?.success === 'true';
          langsmithData.inputs.duration_ms = attributes?.duration_ms;
          if (attributes?.error) {
            langsmithData.outputs.error = attributes.error;
          }
          break;
          
        case 'api_request':
          langsmithData.inputs.model = attributes?.model;
          langsmithData.inputs.input_tokens = attributes?.input_tokens;
          langsmithData.outputs.output_tokens = attributes?.output_tokens;
          langsmithData.extra.cost_usd = attributes?.cost_usd;
          break;
      }

      await langsmithClient.createRun(langsmithData);
      logger.info(`Sent ${eventName} event to LangSmith`);
    }
    
  } catch (error) {
    logger.error('Error processing log for LangSmith:', error);
  }
}

async function processSpanForLangSmith(span, resource) {
  try {
    const { name, startTimeUnixNano, endTimeUnixNano, attributes, events } = span;
    
    const langsmithData = {
      project_name: projectName,
      name: name,
      run_type: 'chain',
      start_time: new Date(startTimeUnixNano / 1000000).toISOString(),
      end_time: new Date(endTimeUnixNano / 1000000).toISOString(),
      inputs: {
        span_attributes: attributes
      },
      outputs: {
        span_events: events
      },
      tags: [
        'claude-code',
        'traces',
        'spans'
      ]
    };

    await langsmithClient.createRun(langsmithData);
    logger.info(`Sent span ${name} to LangSmith`);
    
  } catch (error) {
    logger.error(`Error processing span ${span.name}:`, error);
  }
}

function getRunTypeFromEvent(eventName) {
  switch (eventName) {
    case 'api_request':
    case 'api_error':
      return 'llm';
    case 'tool_result':
    case 'tool_decision':
      return 'tool';
    case 'user_prompt':
      return 'chain';
    default:
      return 'chain';
  }
}

app.listen(port, () => {
  logger.info(`LangSmith proxy server running on port ${port}`);
  logger.info(`Project: ${projectName}`);
  logger.info(`LangSmith API Key: ${process.env.LANGSMITH_API_KEY ? 'Set' : 'Not set'}`);
});