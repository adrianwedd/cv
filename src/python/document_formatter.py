class DocumentFormatter:
    """A utility class for formatting structured data into ATS-compliant documents."""

    @staticmethod
    def to_plain_text(data: dict) -> str:
        """Converts structured data into a plain text, ATS-friendly format.

        Args:
            data: A dictionary containing the structured CV data.

        Returns:
            A string representing the plain text CV.
        """
        text_output = []

        if "name" in data: text_output.append(data["name"].upper())
        if "contact" in data: text_output.append(data["contact"])
        text_output.append("\n")

        if "summary" in data: 
            text_output.append("SUMMARY")
            text_output.append("-" * len("SUMMARY"))
            text_output.append(data["summary"])
            text_output.append("\n")

        if "experience" in data:
            text_output.append("EXPERIENCE")
            text_output.append("-" * len("EXPERIENCE"))
            for job in data["experience"]:
                text_output.append(f"{job.get("title", "")} at {job.get("company", "")}")
                text_output.append(f"{job.get("dates", "")}, {job.get("location", "")}")
                for detail in job.get("details", []):
                    text_output.append(f"- {detail}")
                text_output.append("") # Empty line for spacing
            text_output.append("\n")

        if "skills" in data:
            text_output.append("SKILLS")
            text_output.append("-" * len("SKILLS"))
            for category, skills in data["skills"].items():
                text_output.append(f"{category.upper()}: {", ".join(skills)}")
            text_output.append("\n")

        # Add other sections as needed (education, projects, etc.)

        return "\n".join(text_output)

    @staticmethod
    def to_markdown(data: dict) -> str:
        """Converts structured data into a Markdown format.

        Args:
            data: A dictionary containing the structured CV data.

        Returns:
            A string representing the Markdown CV.
        """
        md_output = []

        if "name" in data: md_output.append(f"# {data["name"]}\n")
        if "contact" in data: md_output.append(f"**Contact:** {data["contact"]}\n")

        if "summary" in data: 
            md_output.append("## Summary\n")
            md_output.append(f"{data["summary"]}\n")

        if "experience" in data:
            md_output.append("## Experience\n")
            for job in data["experience"]:
                md_output.append(f"### {job.get("title", "")} at {job.get("company", "")}\n")
                md_output.append(f"*{job.get("dates", "")}, {job.get("location", "")}*\n")
                for detail in job.get("details", []):
                    md_output.append(f"- {detail}")
                md_output.append("\n")

        if "skills" in data:
            md_output.append("## Skills\n")
            for category, skills in data["skills"].items():
                md_output.append(f"**{category.capitalize()}:** {", ".join(skills)}\n")
            md_output.append("\n")

        # Add other sections as needed

        return "\n".join(md_output)

    @staticmethod
    def to_docx(data: dict) -> str:
        """Placeholder for DOCX generation. Requires python-docx library.

        Args:
            data: A dictionary containing the structured CV data.

        Returns:
            A string indicating DOCX generation is not yet implemented.
        """
        return "DOCX generation not yet implemented. (Requires python-docx)"

    @staticmethod
    def to_latex(data: dict) -> str:
        """Placeholder for LaTeX generation. Requires pandoc or similar.

        Args:
            data: A dictionary containing the structured CV data.

        Returns:
            A string indicating LaTeX generation is not yet implemented.
        """
        return "LaTeX generation not yet implemented. (Requires pandoc)"

# Example Usage (for local testing)
if __name__ == "__main__":
    sample_cv_data = {
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

    print("\n--- Plain Text CV ---")
    plain_text_cv = DocumentFormatter.to_plain_text(sample_cv_data)
    print(plain_text_cv)

    print("\n--- Markdown CV ---")
    markdown_cv = DocumentFormatter.to_markdown(sample_cv_data)
    print(markdown_cv)

    print("\n--- DOCX CV (Placeholder) ---")
    docx_cv = DocumentFormatter.to_docx(sample_cv_data)
    print(docx_cv)

    print("\n--- LaTeX CV (Placeholder) ---")
    latex_cv = DocumentFormatter.to_latex(sample_cv_data)
    print(latex_cv)
