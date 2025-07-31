import unittest
import json
from src.python.document_parsing.cv_parser import CVParser

class TestCVParser(unittest.TestCase):

    def setUp(self):
        self.parser = CVParser()
        # Use a simplified sample text for testing the LLM integration
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

    def test_parse_cv_llm_integration(self):
        parsed_data = self.parser.parse_cv(self.sample_cv_text)
        
        # Assertions based on the mock_parsed_data in cv_parser.py
        self.assertIn("name", parsed_data)
        self.assertEqual(parsed_data["name"], "Adrian Wedd")
        
        self.assertIn("contact", parsed_data)
        self.assertEqual(parsed_data["contact"], "adrian@wedd.au | 0407081084 | adrianwedd.com")
        
        self.assertIn("summary", parsed_data)
        self.assertIn("seasoned IT professional", parsed_data["summary"])
        
        self.assertIn("experience", parsed_data)
        self.assertGreater(len(parsed_data["experience"]), 0)
        self.assertEqual(parsed_data["experience"][0]["company"], "Homes Tasmania (formerly Department of Communities Tasmania)")
        self.assertEqual(parsed_data["experience"][0]["title"], "Systems Analyst / Acting Senior Change Analyst / Acting Senior Applications Specialist")
        self.assertEqual(parsed_data["experience"][0]["dates"], "May 2018 - Present")

        self.assertIn("referees", parsed_data)
        self.assertEqual(parsed_data["referees"], "Available on request.")

if __name__ == '__main__':
    unittest.main()