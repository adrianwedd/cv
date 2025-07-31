
import re
import json
import os
import requests

class CVParser:
    """A parser for extracting structured information from unstructured CV text using an LLM."""

    CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"

    def __init__(self):
        self.claude_api_key = os.environ.get("CLAUDE_API_KEY")
        if not self.claude_api_key:
            raise ValueError("CLAUDE_API_KEY environment variable not set.")

    def parse_cv(self, text: str) -> dict:
        """Parses the entire CV text using an LLM and extracts structured data."""
        llm_response_json = self._call_llm_for_parsing(text)
        return llm_response_json

    def _call_llm_for_parsing(self, cv_text: str) -> dict:
        """
        Makes an API call to Claude to parse CV text into structured JSON.
        This method constructs an XML prompt and sends it to the Claude API.
        """
        # Conceptual XML Prompt Structure for Claude
        xml_prompt = f"""<request>
    <meta-instructions>
        You are an expert CV parser. Your task is to extract all relevant information
        from the provided CV text and return it as a structured JSON object.
        Ensure all fields are accurately extracted and formatted.
        The JSON object should be enclosed in <json> and </json> tags.
    </meta-instructions>
    <output-format>
        Return a JSON object with the following keys:
        - "name": string
        - "contact": string (email, phone, LinkedIn, website)
        - "summary": string
        - "technical_expertise": array of strings
        - "experience": array of objects, each with:
            - "company": string
            - "title": string
            - "dates": string
            - "details": array of strings (bullet points)
        - "education": array of objects (if present)
        - "skills": object with categories (e.g., "programming", "cloud") and arrays of strings
        - "referees": string (e.g., "Available on request." or contact details)
    </output-format>
    <cv-text>
        {cv_text}
    </cv-text>
</request>"""

        headers = {
            "x-api-key": self.claude_api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }

        data = {
            "model": "claude-3-opus-20240229", # Or another suitable Claude model
            "max_tokens": 4000, # Adjust as needed
            "messages": [
                {"role": "user", "content": xml_prompt}
            ]
        }

        try:
            response = requests.post(self.CLAUDE_API_URL, headers=headers, json=data)
            response.raise_for_status() # Raise an exception for HTTP errors
            
            claude_response = response.json()
            # Extract JSON from Claude's response (assuming it's wrapped in <json> tags)
            content_blocks = claude_response.get("content", [])
            for block in content_blocks:
                if block.get("type") == "text":
                    text_content = block.get("text", "")
                    json_match = re.search(r"<json>(.*?)</json>", text_content, re.DOTALL)
                    if json_match:
                        return json.loads(json_match.group(1))
            raise ValueError("No JSON object found in Claude's response.")

        except requests.exceptions.RequestException as e:
            print(f"Claude API Request Error: {e}")
            if e.response is not None:
                print(f"Response Status Code: {e.response.status_code}")
                print(f"Response Body: {e.response.text}")
            raise
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON from Claude's response: {e}")
            raise
        except Exception as e:
            print(f"An unexpected error occurred during Claude API call: {e}")
            raise
