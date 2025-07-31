import re
import json

class CVParser:
    """A parser for extracting structured information from unstructured CV text using an LLM."""

    def parse_cv(self, text: str) -> dict:
        """Parses the entire CV text using an LLM and extracts structured data."""
        # In a real scenario, this would involve an API call to Claude
        # For this prototype, we simulate the LLM's response based on the prompt structure.
        
        llm_response_json = self._call_llm_for_parsing(text)
        return llm_response_json

    def _call_llm_for_parsing(self, cv_text: str) -> dict:
        """
        Simulates an LLM call to parse CV text into structured JSON.
        This method would construct an XML prompt and send it to an LLM API.
        """
        # Conceptual XML Prompt Structure for Claude
        xml_prompt = f"""<request>
    <meta-instructions>
        You are an expert CV parser. Your task is to extract all relevant information
        from the provided CV text and return it as a structured JSON object.
        Ensure all fields are accurately extracted and formatted.
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
        
        # Simulate LLM response based on the provided sample CV text
        # In a real implementation, you would send xml_prompt to Claude and parse its JSON output.
        # For this prototype, we'll return a hardcoded structure that matches the sample CV.
        
        # This is a simplified mock response. A real LLM would parse the text dynamically.
        mock_parsed_data = {
            "name": "Adrian Wedd",
            "contact": "adrian@wedd.au | 0407081084 | adrianwedd.com",
            "summary": "A seasoned IT professional with extensive experience in driving digital transformation across various roles within IT support, systems analysis, and digital strategy. Known for a profound ability to adapt and innovate in a rapidly changing technological landscape, I specialise in systems integration, cybersecurity, and applications optimization, leveraging my deep technical expertise to translate complex concepts into actionable business strategies.",
            "technical_expertise": [
                "Systems Integration: Advanced proficiency in integrating diverse systems and platforms to ensure seamless communication and data exchange.",
                "API Development and Management: Skilled in developing, testing and managing APIs to enhance system functionality and interoperability.",
                "Programming Languages: Proficient in Python and JavaScript, focusing on creating bespoke, reusable solutions for repeatable tasks and testing automation.",
                "Generative AI and Large Language Models: Experienced in leveraging cutting-edge generative AI technologies to create innovative applications and insights.",
                "Applications Optimization & Troubleshooting: Demonstrated ability to proactively identify and resolve critical performance bottlenecks, enhancing system performance and user experience."
            ],
            "experience": [
                {
                    "company": "Homes Tasmania (formerly Department of Communities Tasmania)",
                    "title": "Systems Analyst / Acting Senior Change Analyst / Acting Senior Applications Specialist",
                    "dates": "May 2018 - Present",
                    "details": [
                        "Enhanced the integration of the Housing Management System (HMS) with external services, employing RESTful APIs and SFTP, enhancing data exchange and operational efficiency.",
                        "Led cybersecurity initiatives, significantly improving system security and reducing vulnerabilities.",
                        "Employed Python, PowerShell and JavaScript to develop and implement automation scripts, streamlining operations and improving service delivery."
                    ]
                },
                {
                    "company": "University of Tasmania",
                    "title": "ITS Client Services Officer",
                    "dates": "July 2015 - May 2018",
                    "details": [
                        "Provided first-line IT support, resolving complex technical problems and developing procedural documentation."
                    ]
                },
                {
                    "company": "Digital Agency PTY LTD",
                    "title": "Director",
                    "dates": "February 2015 - May 2018",
                    "details": [
                        "Delivered digital marketing strategies, leveraging Google Analytics and Google AdWords to drive audience growth."
                    ]
                },
                {
                    "company": "The Wilderness Society Inc.",
                    "title": "Second Level IT Support Engineer",
                    "dates": "2012 - 2015",
                    "details": [
                        "Managed IT infrastructure, ensuring optimal system performance and security."
                    ]
                },
                {
                    "company": "Greenpeace Australia Pacific",
                    "title": "Communications and Logistics Coordinator",
                    "dates": "2010 - 2011",
                    "details": [
                        "Planned and coordinated high-profile environmental campaign activities, ensuring logistical success and legal compliance."
                    ]
                }
            ],
            "referees": "Available on request."
        }
        return mock_parsed_data