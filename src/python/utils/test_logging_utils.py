
import unittest
import os
import json
from src.python.utils.logging_utils import setup_logger, MetricsCollector

class TestLoggingAndMetrics(unittest.TestCase):

    def test_logger(self):
        log_file = 'test.log'
        logger = setup_logger('test_logger', log_file)
        logger.info('This is a test message.')

        self.assertTrue(os.path.exists(log_file))
        with open(log_file, 'r') as f:
            self.assertIn('This is a test message.', f.read())

        os.remove(log_file)

    def test_metrics_collector(self):
        metrics_collector = MetricsCollector()
        metrics_collector.collect('test_metric', 123)
        metrics = metrics_collector.get_metrics()

        self.assertIn('test_metric', metrics)
        self.assertEqual(metrics['test_metric'], 123)

        metrics_file = 'test_metrics.json'
        metrics_collector.save_metrics(metrics_file)

        self.assertTrue(os.path.exists(metrics_file))
        with open(metrics_file, 'r') as f:
            saved_metrics = json.load(f)
            self.assertEqual(saved_metrics['test_metric'], 123)

        os.remove(metrics_file)

if __name__ == '__main__':
    unittest.main()

