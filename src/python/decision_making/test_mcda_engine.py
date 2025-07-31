
import unittest
from src.python.decision_making.mcda_engine import MCDAEngine

class TestMCDAEngine(unittest.TestCase):

    def test_calculate_opportunity_score(self):
        config = [
            {"name": "skill_alignment", "weight": 0.5},
            {"name": "company_growth_potential", "weight": 0.5}
        ]
        engine = MCDAEngine(config)
        opportunity = {
            "skill_alignment": 0.8,
            "company_growth_potential": 0.6
        }
        score = engine.calculate_opportunity_score(opportunity)
        self.assertAlmostEqual(score['total_score'], 0.7)

    def test_normalize_weights(self):
        config = [
            {"name": "impact", "weight": 5},
            {"name": "learning_potential", "weight": 5}
        ]
        engine = MCDAEngine(config)
        self.assertAlmostEqual(engine.criteria['impact'], 0.5)
        self.assertAlmostEqual(engine.criteria['learning_potential'], 0.5)

if __name__ == '__main__':
    unittest.main()
