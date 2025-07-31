
import unittest
from unittest.mock import patch, MagicMock
import os
import requests
from src.python.api_wrappers.external_apis import AbstractApiWrapper, IntellizenceApiWrapper

class TestApiWrappers(unittest.TestCase):

    @patch.dict(os.environ, {'ABSTRACT_API_KEY': 'test_abstract_key'})
    @patch('requests.get')
    def test_abstract_api_success(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"company": "TestCo"}
        mock_get.return_value = mock_response

        wrapper = AbstractApiWrapper()
        result = wrapper.get_company_info("test.com")

        self.assertEqual(result, {"company": "TestCo"})
        mock_get.assert_called_once_with(
            AbstractApiWrapper.BASE_URL,
            params={'api_key': 'test_abstract_key', 'domain': 'test.com'}
        )

    @patch.dict(os.environ, {'ABSTRACT_API_KEY': 'test_abstract_key'})
    @patch('requests.get')
    def test_abstract_api_failure(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.raise_for_status.side_effect = requests.exceptions.RequestException("Bad Request")
        mock_get.return_value = mock_response

        wrapper = AbstractApiWrapper()
        result = wrapper.get_company_info("bad.com")

        self.assertIsNone(result)

    @patch.dict(os.environ, {'INTELLIZENCE_API_KEY': 'test_intellizence_key'})
    @patch('requests.get')
    def test_intellizence_api_success(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"funding": [{"amount": 100}]}
        mock_get.return_value = mock_response

        wrapper = IntellizenceApiWrapper()
        result = wrapper.get_funding_data(query_params={'country': 'USA'})

        self.assertEqual(result, {"funding": [{"amount": 100}]})
        mock_get.assert_called_once_with(
            IntellizenceApiWrapper.BASE_URL,
            headers={'Authorization': 'Bearer test_intellizence_key'},
            params={'country': 'USA'}
        )

    @patch.dict(os.environ, {'INTELLIZENCE_API_KEY': 'test_intellizence_key'})
    @patch('requests.get')
    def test_intellizence_api_failure(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = requests.exceptions.RequestException("Internal Server Error")
        mock_get.return_value = mock_response

        wrapper = IntellizenceApiWrapper()
        result = wrapper.get_funding_data(query_params={'country': 'USA'})

        self.assertIsNone(result)

    def test_abstract_api_no_key(self):
        # Temporarily remove the env var if it exists for this test
        original_env = os.environ.copy()
        if 'ABSTRACT_API_KEY' in os.environ:
            del os.environ['ABSTRACT_API_KEY']
        try:
            with self.assertRaises(ValueError) as cm:
                AbstractApiWrapper()
            self.assertIn("ABSTRACT_API_KEY is required.", str(cm.exception))
        finally:
            os.environ.clear()
            os.environ.update(original_env)

    def test_intellizence_api_no_key(self):
        # Temporarily remove the env var if it exists for this test
        original_env = os.environ.copy()
        if 'INTELLIZENCE_API_KEY' in os.environ:
            del os.environ['INTELLIZENCE_API_KEY']
        try:
            with self.assertRaises(ValueError) as cm:
                IntellizenceApiWrapper()
            self.assertIn("INTELLIZENCE_API_KEY is required.", str(cm.exception))
        finally:
            os.environ.clear()
            os.environ.update(original_env)

if __name__ == '__main__':
    unittest.main()
