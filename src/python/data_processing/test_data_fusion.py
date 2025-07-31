
import unittest
from src.python.data_processing.data_fusion import DataFusion

class TestDataFusion(unittest.TestCase):

    def test_create_company_intelligence_profile(self):
        profile = DataFusion.create_company_intelligence_profile()
        self.assertIn("firmographics", profile)
        self.assertIn("funding", profile)
        self.assertIn("technographics", profile)
        self.assertIn("nlp_analysis", profile)
        self.assertIn("sentiment", profile)

    def test_create_professional_intelligence_profile(self):
        profile = DataFusion.create_professional_intelligence_profile()
        self.assertIn("github_intelligence", profile)
        self.assertIn("nlp_insights", profile)
        self.assertIn("skill_validation", profile)

    def test_merge_profiles(self):
        profile1 = {"a": 1, "b": {"c": 2}}
        profile2 = {"b": {"d": 3}, "e": 4}
        merged = DataFusion.merge_profiles(profile1, profile2)
        self.assertEqual(merged, {"a": 1, "b": {"c": 2, "d": 3}, "e": 4})

if __name__ == '__main__':
    unittest.main()
