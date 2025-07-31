
# Logging and Metrics Utilities

This directory contains utility modules for logging and metrics collection.

## `logging_utils.py`

### `setup_logger(name, log_file, level=logging.INFO)`

This function sets up a logger that writes to both a specified log file and the console.

**Usage:**

```python
from utils.logging_utils import setup_logger

logger = setup_logger(__name__, 'my_app.log')
logger.info('This is an info message.')
```

### `MetricsCollector`

This class provides a simple way to collect and store metrics.

**Usage:**

```python
from utils.logging_utils import MetricsCollector

metrics_collector = MetricsCollector()
metrics_collector.collect('requests_processed', 100)
metrics_collector.collect('errors', 5)

metrics = metrics_collector.get_metrics()
print(metrics)

metrics_collector.save_metrics('metrics.json')
```

