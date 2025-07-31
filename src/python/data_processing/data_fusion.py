import json

class DataFusion:
    """A utility class for fusing disparate data streams into unified profiles."""

    @staticmethod
    def create_company_intelligence_profile(
        firmographic_data: dict = None,
        funding_data: dict = None,
        technographic_data: dict = None,
        nlp_analysis_data: dict = None,
        sentiment_data: dict = None
    ) -> dict:
        """Creates a comprehensive Company Intelligence Profile.

        Args:
            firmographic_data: Data about company size, industry, location.
            funding_data: Data about investment rounds, funding amounts.
            technographic_data: Data about programming languages, frameworks.
            nlp_analysis_data: NLP-extracted skills, qualifications from job descriptions.
            sentiment_data: Aggregated sentiment score from news.

        Returns:
            A dictionary representing the fused Company Intelligence Profile.
        """
        profile = {
            "firmographics": firmographic_data if firmographic_data is not None else {},
            "funding": funding_data if funding_data is not None else {},
            "technographics": technographic_data if technographic_data is not None else {},
            "nlp_analysis": nlp_analysis_data if nlp_analysis_data is not None else {},
            "sentiment": sentiment_data if sentiment_data is not None else {},
            "_metadata": {
                "timestamp": "", # To be filled at integration
                "source_modules": [] # To be filled at integration
            }
        }
        return profile

    @staticmethod
    def create_professional_intelligence_profile(
        github_data: dict = None,
        nlp_analysis_data: dict = None,
        skill_validation_data: dict = None
    ) -> dict:
        """Creates a comprehensive Professional Intelligence Profile.

        Args:
            github_data: Enhanced GitHub data (commits, issues, PRs, analytics).
            nlp_analysis_data: NLP-extracted insights from GitHub data.
            skill_validation_data: Data from skill validation against code usage.

        Returns:
            A dictionary representing the fused Professional Intelligence Profile.
        """
        profile = {
            "github_intelligence": github_data if github_data is not None else {},
            "nlp_insights": nlp_analysis_data if nlp_analysis_data is not None else {},
            "skill_validation": skill_validation_data if skill_validation_data is not None else {},
            "_metadata": {
                "timestamp": "", # To be filled at integration
                "source_modules": [] # To be filled at integration
            }
        }
        return profile

    @staticmethod
    def merge_profiles(profile1: dict, profile2: dict) -> dict:
        """Merges two profiles, with values from profile2 overriding profile1 for common keys."""
        merged = profile1.copy()
        for key, value in profile2.items():
            if isinstance(value, dict) and key in merged and isinstance(merged[key], dict):
                merged[key] = DataFusion.merge_profiles(merged[key], value)
            else:
                merged[key] = value
        return merged

# Example Usage (for local testing)
if __name__ == "__main__":
    # Example Company Data
    firm_data = {"company_name": "TechCorp", "industry": "Software", "employees": 1000}
    fund_data = {"last_round": "Series C", "amount": "$50M"}
    tech_data = {"languages": ["Python", "JavaScript"], "cloud": "AWS"}
    nlp_data_comp = {"extracted_skills": ["AI", "ML"], "keywords": ["innovation"]}
    sent_data = {"score": 0.8, "sentiment": "positive"}

    company_profile = DataFusion.create_company_intelligence_profile(
        firmographic_data=firm_data,
        funding_data=fund_data,
        technographic_data=tech_data,
        nlp_analysis_data=nlp_data_comp,
        sentiment_data=sent_data
    )
    print("\n--- Company Intelligence Profile ---")
    print(json.dumps(company_profile, indent=2))

    # Example Professional Data
    gh_data = {"total_commits": 1500, "top_languages": ["Python", "TypeScript"]}
    nlp_data_prof = {"themes": ["backend", "devops"], "sentiment": "neutral"}
    skill_val_data = {"validated_skills": ["Python", "Docker"], "confidence": 0.9}

    professional_profile = DataFusion.create_professional_intelligence_profile(
        github_data=gh_data,
        nlp_analysis_data=nlp_data_prof,
        skill_validation_data=skill_val_data
    )
    print("\n--- Professional Intelligence Profile ---")
    print(json.dumps(professional_profile, indent=2))

    # Example Merging
    profile_part1 = {"name": "Alice", "details": {"age": 30, "city": "NY"}}
    profile_part2 = {"details": {"city": "LA", "occupation": "Engineer"}, "status": "active"}
    merged_profile = DataFusion.merge_profiles(profile_part1, profile_part2)
    print("\n--- Merged Profile ---")
    print(json.dumps(merged_profile, indent=2))
