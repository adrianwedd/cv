
import logging
import json
from datetime import datetime

def setup_logger(name, log_file, level=logging.INFO):
    """Set up a logger that writes to a file and the console."""
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    # File handler
    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(formatter)

    # Console handler
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)

    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.addHandler(file_handler)
    logger.addHandler(stream_handler)

    return logger

class MetricsCollector:
    """A simple class to collect and store metrics."""
    def __init__(self):
        self.metrics = {}

    def collect(self, name, value):
        """Collect a single metric."""
        self.metrics[name] = value

    def get_metrics(self):
        """Return all collected metrics."""
        return self.metrics

    def save_metrics(self, file_path):
        """Save the collected metrics to a JSON file."""
        with open(file_path, 'w') as f:
            json.dump(self.metrics, f, indent=4)

