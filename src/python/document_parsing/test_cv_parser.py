

import unittest
import json
import requests
from unittest.mock import patch, Mock
from src.python.document_parsing.cv_parser import CVParser

class TestCVParser(unittest.TestCase):

    def setUp(self):
        # Ensure CLAUDE_API_KEY is set for initialization, even if mocked later
        self.mock_api_key = "mock_api_key"
        with patch.dict( 'os.environ', {'CLAUDE_API_KEY': self.mock_api_key}):
            self.parser = CVParser()

        self.sample_cv_text = """
Adrian Wedd
adrian@wedd.au | 0407081084 | adrianwedd.com

Professional Summary
A seasoned IT professional with extensive experience.

Professional Experience
Homes Tasmania
Systems Analyst (May 2018 - Present)
• Enhanced integration.
University of Tasmania
ITS Client Services Officer (July 2015 - May 2018)
• Provided IT support.

Referees
Available on request.
"""

    @patch('requests.post')
    def test_parse_cv_with_claude_api(self, mock_post):
        # Mock Claude's successful response
        mock_response_content = {
            "content": [
                {
                    "type": "text",
                    "text": "<json>{\"name\": \"Adrian Wedd\", \"contact\": \"adrian@wedd.au | 0407081084 | adrianwedd.com\", \"summary\": \"A seasoned IT professional with extensive experience.\", \"experience\": [{\"company\": \"Homes Tasmania\", \"title\": \"Systems Analyst\", \"dates\": \"May 2018 - Present\", \"details\": [\"Enhanced integration.\"]}, {\"company\": \"University of Tasmania\", \"title\": \"ITS Client Services Officer\", \"dates\": \"July 2015 - May 2018\", \"details\": [\"Provided IT support.\"]}], \"referees\": \"Available on request.\"}</json>"
                }
            ]
        }
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_response_content
        mock_response.raise_for_status.return_value = None # Ensure no HTTP errors are raised
        mock_post.return_value = mock_response

        parsed_data = self.parser.parse_cv(self.sample_cv_text)
        
        # Assertions based on the mock Claude response
        self.assertIn("name", parsed_data)
        self.assertEqual(parsed_data["name"], "Adrian Wedd")
        
        self.assertIn("contact", parsed_data)
        self.assertEqual(parsed_data["contact"], "adrian@wedd.au | 0407081084 | adrianwedd.com")
        
        self.assertIn("summary", parsed_data)
        self.assertEqual(parsed_data["summary"], "A seasoned IT professional with extensive experience.")
        
        self.assertIn("experience", parsed_data)
        self.assertEqual(len(parsed_data["experience"]), 2)
        self.assertEqual(parsed_data["experience"][0]["company"], "Homes Tasmania")
        self.assertEqual(parsed_data["experience"][0]["title"], "Systems Analyst")
        self.assertEqual(parsed_data["experience"][0]["dates"], "May 2018 - Present")

        self.assertIn("referees", parsed_data)
        self.assertEqual(parsed_data["referees"], "Available on request.")

        # Verify that requests.post was called with correct arguments
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        self.assertEqual(args[0], self.parser.CLAUDE_API_URL)
        self.assertIn("x-api-key", kwargs["headers"])
        self.assertEqual(kwargs["headers"]["x-api-key"], self.mock_api_key)
        self.assertIn("messages", kwargs["json"])
        self.assertIn("claude-3-opus-20240229", kwargs["json"]["model"])

    @patch('requests.post')
    def test_parse_cv_api_error(self, mock_post):
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("Bad Request")
        mock_post.return_value = mock_response

        with self.assertRaises(requests.exceptions.RequestException):
            self.parser.parse_cv(self.sample_cv_text)

    @patch('requests.post')
    def test_parse_cv_no_json_in_response(self, mock_post):
        mock_response_content = {
            "content": [
                {
                    "type": "text",
                    "text": "Some random text without JSON tags."
                }
            ]
        }
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_response_content
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        with self.assertRaises(ValueError) as cm:
            self.parser.parse_cv(self.sample_cv_text)
        self.assertIn("No JSON object found in Claude's response.", str(cm.exception))

if __name__ == '__main__':
    unittest.main()
