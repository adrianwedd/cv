import json

class MCDAEngine:
    """A Multi-Criteria Decision Analysis (MCDA) engine for scoring opportunities."""

    def __init__(self, criteria_config: list):
        """Initializes the MCDAEngine with a list of criteria and their weights.

        Args:
            criteria_config: A list of dictionaries, each with 'name' and 'weight' keys.
                             Example: [{'name': 'skill_alignment', 'weight': 0.3},
                                       {'name': 'company_growth_potential', 'weight': 0.2}]
        """
        self.criteria = {item['name']: item['weight'] for item in criteria_config}
        total_weight = sum(self.criteria.values())
        if total_weight == 0:
            raise ValueError("Total weight of criteria cannot be zero.")
        if abs(total_weight - 1.0) > 1e-9: # Check if sum is approximately 1.0
            print(f"Warning: Criteria weights do not sum to 1.0. Normalizing. Current sum: {total_weight}")
            self._normalize_weights()

    def _normalize_weights(self):
        """Normalizes the weights so they sum to 1.0."""
        total_weight = sum(self.criteria.values())
        for name in self.criteria:
            self.criteria[name] /= total_weight

    def calculate_opportunity_score(self, opportunity_data: dict) -> dict:
        """Calculates a comprehensive opportunity score based on defined criteria.

        Args:
            opportunity_data: A dictionary containing scores for each criterion.
                              Scores should be normalized (e.g., 0 to 1).
                              Example: {'skill_alignment': 0.8, 'company_growth_potential': 0.7}

        Returns:
            A dictionary containing the total score and individual weighted scores.
        """
        total_score = 0.0
        weighted_scores = {}

        for criterion_name, weight in self.criteria.items():
            score = opportunity_data.get(criterion_name, 0.0) # Default to 0 if criterion not present
            weighted_score = score * weight
            total_score += weighted_score
            weighted_scores[criterion_name] = weighted_score

        return {
            "total_score": total_score,
            "weighted_scores": weighted_scores,
            "criteria_weights": self.criteria
        }

# Example Usage (for local testing)
if __name__ == "__main__":
    # Example 1: Basic usage with normalized weights
    config1 = [
        {"name": "skill_alignment", "weight": 0.3},
        {"name": "company_growth_potential", "weight": 0.2},
        {"name": "tech_stack_match", "weight": 0.25},
        {"name": "work_life_balance_proxy", "weight": 0.15},
        {"name": "location_preference", "weight": 0.1}
    ]
    engine1 = MCDAEngine(config1)

    opportunity1 = {
        "skill_alignment": 0.9,
        "company_growth_potential": 0.7,
        "tech_stack_match": 0.8,
        "work_life_balance_proxy": 0.6,
        "location_preference": 0.95
    }
    score1 = engine1.calculate_opportunity_score(opportunity1)
    print("\n--- Opportunity 1 Score (Normalized Weights) ---")
    print(json.dumps(score1, indent=2))

    # Example 2: Weights that don't sum to 1.0 (should be normalized internally)
    config2 = [
        {"name": "impact", "weight": 5},
        {"name": "learning_potential", "weight": 3},
        {"name": "compensation", "weight": 4}
    ]
    engine2 = MCDAEngine(config2)

    opportunity2 = {
        "impact": 0.9,
        "learning_potential": 0.7,
        "compensation": 0.8
    }
    score2 = engine2.calculate_opportunity_score(opportunity2)
    print("\n--- Opportunity 2 Score (Unnormalized Weights) ---")
    print(json.dumps(score2, indent=2))

    # Example 3: Missing criterion in opportunity data
    opportunity3 = {
        "skill_alignment": 0.7,
        "company_growth_potential": 0.5
        # tech_stack_match is missing
    }
    score3 = engine1.calculate_opportunity_score(opportunity3)
    print("\n--- Opportunity 3 Score (Missing Criterion) ---")
    print(json.dumps(score3, indent=2))
