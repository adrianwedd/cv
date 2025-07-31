import re
import json

class NLPUtils:
    """A utility class for Natural Language Processing tasks."""

    def __init__(self):
        # Placeholder for a more sophisticated sentiment model or lexicon
        self.positive_keywords = ["excellent", "great", "successful", "achieved", "improved", "strong", "innovative"]
        self.negative_keywords = ["challenge", "issue", "problem", "failed", "difficult"]

        # Placeholder for a more comprehensive skill taxonomy
        self.skill_taxonomy = {
            "programming": ["python", "javascript", "java", "c++", "go", "rust"],
            "cloud": ["aws", "azure", "gcp", "docker", "kubernetes"],
            "data_science": ["machine learning", "deep learning", "ai", "nlp", "data analysis"],
            "devops": ["ci/cd", "jenkins", "github actions", "terraform"]
        }

    def extract_entities(self, text: str, entity_type: str = "skills") -> list:
        """Extracts entities (e.g., skills) from text using keyword matching.

        Args:
            text: The input text.
            entity_type: The type of entities to extract (e.g., "skills").

        Returns:
            A list of extracted entities.
        """
        extracted = []
        text_lower = text.lower()

        if entity_type == "skills":
            for category, skills in self.skill_taxonomy.items():
                for skill in skills:
                    if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
                        extracted.append(skill)
        # Add more entity types as needed (e.g., names, organizations)
        return list(set(extracted)) # Return unique skills

    def analyze_sentiment(self, text: str) -> str:
        """Performs basic sentiment analysis based on keywords.

        Args:
            text: The input text.

        Returns:
            "positive", "negative", or "neutral".
        """
        text_lower = text.lower()
        positive_score = sum(1 for keyword in self.positive_keywords if keyword in text_lower)
        negative_score = sum(1 for keyword in self.negative_keywords if keyword in text_lower)

        if positive_score > negative_score:
            return "positive"
        elif negative_score > positive_score:
            return "negative"
        else:
            return "neutral"

    def normalize_skill(self, skill: str) -> str:
        """Normalizes a skill to a canonical form based on a predefined taxonomy.

        Args:
            skill: The skill string to normalize.

        Returns:
            The normalized skill or the original skill if not found in taxonomy.
        """
        skill_lower = skill.lower()
        for category, skills in self.skill_taxonomy.items():
            if skill_lower in skills:
                return skill_lower # Return the canonical form from our taxonomy
        return skill # Return original if not found

# Example Usage (for local testing)
if __name__ == "__main__":
    nlp_utils = NLPUtils()

    text1 = "Developed an excellent machine learning model that improved efficiency."
    text2 = "Faced a difficult problem with the project, but resolved the issue."
    text3 = "This is a neutral statement."
    text4 = "Proficient in Python, Docker, and AWS."

    print(f"\n--- Sentiment Analysis ---")
    print(f"Text 1: '{text1}' -> Sentiment: {nlp_utils.analyze_sentiment(text1)}")
    print(f"Text 2: '{text2}' -> Sentiment: {nlp_utils.analyze_sentiment(text2)}")
    print(f"Text 3: '{text3}' -> Sentiment: {nlp_utils.analyze_sentiment(text3)}")

    print(f"\n--- Skill Extraction ---")
    extracted_skills = nlp_utils.extract_entities(text4, entity_type="skills")
    print(f"Text 4: '{text4}' -> Extracted Skills: {extracted_skills}")

    print(f"\n--- Skill Normalization ---")
    print(f"'python' normalized: {nlp_utils.normalize_skill('Python')}")
    print(f"'Machine Learning' normalized: {nlp_utils.normalize_skill('Machine Learning')}")
    print(f"'cloud computing' normalized: {nlp_utils.normalize_skill('cloud computing')}") # Not in basic taxonomy

