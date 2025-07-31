
import unittest
from src.python.formatting.document_formatter import DocumentFormatter

class TestDocumentFormatter(unittest.TestCase):

    def setUp(self):
        self.sample_cv_data = {
            "name": "Jane Doe",
            "contact": "jane.doe@example.com | LinkedIn.com/in/janedoe",
            "summary": "Highly motivated software engineer with 5 years of experience in web development and cloud solutions.",
            "experience": [
                {
                    "title": "Software Engineer",
                    "company": "Tech Solutions Inc.",
                    "dates": "Jan 2020 - Present",
                    "location": "San Francisco, CA",
                    "details": [
                        "Developed and maintained scalable web applications using Python and Django.",
                        "Implemented CI/CD pipelines, reducing deployment time by 30%.",
                        "Collaborated with cross-functional teams to deliver high-quality software."
                    ]
                }
            ],
            "skills": {
                "programming": ["Python", "JavaScript", "Java"],
                "web_frameworks": ["Django", "React", "Node.js"],
                "cloud": ["AWS", "Azure", "Docker"]
            }
        }

    def test_to_plain_text(self):
        plain_text_cv = DocumentFormatter.to_plain_text(self.sample_cv_data)
        self.assertIn("JANE DOE", plain_text_cv)
        self.assertIn("SUMMARY", plain_text_cv)
        self.assertIn("EXPERIENCE", plain_text_cv)
        self.assertIn("SKILLS", plain_text_cv)

    def test_to_markdown(self):
        markdown_cv = DocumentFormatter.to_markdown(self.sample_cv_data)
        self.assertIn("# Jane Doe", markdown_cv)
        self.assertIn("## Summary", markdown_cv)
        self.assertIn("## Experience", markdown_cv)
        self.assertIn("## Skills", markdown_cv)

    def test_to_docx(self):
        docx_cv = DocumentFormatter.to_docx(self.sample_cv_data)
        self.assertEqual(docx_cv, "DOCX generation not yet implemented. (Requires python-docx)")

    def test_to_latex(self):
        latex_cv = DocumentFormatter.to_latex(self.sample_cv_data)
        self.assertEqual(latex_cv, "LaTeX generation not yet implemented. (Requires pandoc)")

if __name__ == '__main__':
    unittest.main()
