
import unittest
from src.python.nlp.nlp_utils import NLPUtils

class TestNLPUtils(unittest.TestCase):

    def setUp(self):
        self.nlp_utils = NLPUtils()

    def test_extract_entities(self):
        text = "I have experience with Python, Java, and AWS."
        skills = self.nlp_utils.extract_entities(text)
        self.assertCountEqual(skills, ["python", "java", "aws"])

        text_with_duplicates = "I love python and more python"
        skills_no_duplicates = self.nlp_utils.extract_entities(text_with_duplicates)
        self.assertCountEqual(skills_no_duplicates, ["python"])

    def test_analyze_sentiment(self):
        positive_text = "This was an excellent and successful project."
        self.assertEqual(self.nlp_utils.analyze_sentiment(positive_text), "positive")

        negative_text = "We encountered a difficult problem."
        self.assertEqual(self.nlp_utils.analyze_sentiment(negative_text), "negative")

        neutral_text = "This is a statement."
        self.assertEqual(self.nlp_utils.analyze_sentiment(neutral_text), "neutral")

    def test_normalize_skill(self):
        self.assertEqual(self.nlp_utils.normalize_skill("Python"), "python")
        self.assertEqual(self.nlp_utils.normalize_skill("AWS"), "aws")
        self.assertEqual(self.nlp_utils.normalize_skill("UnknownSkill"), "UnknownSkill")

if __name__ == '__main__':
    unittest.main()
