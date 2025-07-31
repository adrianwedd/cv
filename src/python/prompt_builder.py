class PromptBuilder:
    """A utility class for programmatically building complex LLM prompts."""

    @staticmethod
    def build_synthesis_prompt(
        user_profile: dict,
        job_description: str,
        company_intelligence: dict,
        instructions: str = "",
        cot_reasoning: str = ""
    ) -> str:
        """Builds a synthesis prompt for LLMs to generate tailored content.

        Args:
            user_profile: Dictionary containing the user's master resume/profile data.
            job_description: The full text of the job description.
            company_intelligence: The fused Company Intelligence Profile.
            instructions: Specific instructions for the LLM regarding desired output.
            cot_reasoning: Chain-of-Thought reasoning guidance for the LLM.

        Returns:
            A formatted string representing the LLM prompt.
        """
        prompt = f"""You are an expert career advisor and content generator.

User Profile:
{user_profile}

Job Description:
{job_description}

Company Intelligence Profile:
{company_intelligence}

Instructions:
{instructions}

Chain-of-Thought:
{cot_reasoning}

Based on the provided information, generate highly tailored content. Ensure the content is professional, persuasive, and directly addresses the requirements and context of the job and company. Focus on highlighting the user's relevant experience and skills, strategically positioning them for this specific opportunity.
"""
        return prompt

    @staticmethod
    def build_ats_resume_prompt(
        user_profile: dict,
        job_description: str,
        company_intelligence: dict,
        target_format: str = "markdown",
        focus_areas: list = None
    ) -> str:
        """Builds a prompt for generating an ATS-compliant resume section.

        Args:
            user_profile: Dictionary containing the user's master resume/profile data.
            job_description: The full text of the job description.
            company_intelligence: The fused Company Intelligence Profile.
            target_format: Desired output format (e.g., "markdown", "plain_text").
            focus_areas: List of specific skills or experiences to emphasize.

        Returns:
            A formatted string representing the LLM prompt for resume generation.
        """
        focus_str = f"Emphasize the following areas: {', '.join(focus_areas)}." if focus_areas else ""
        prompt = f"""You are an expert resume writer. Generate an ATS-compliant resume section for the user based on their profile and the job description.

User Profile:
{user_profile}

Job Description:
{job_description}

Company Intelligence Profile:
{company_intelligence}

Instructions:
-   Generate content in {target_format} format.
-   Ensure strict ATS compliance (standard headings, no complex formatting).
-   Focus on quantifiable achievements and action verbs.
-   Strategically incorporate keywords from the job description.
{focus_str}

Chain-of-Thought:
1.  Identify key requirements and keywords from the Job Description.
2.  Map these to the most relevant experiences and skills in the User Profile.
3.  Draft compelling, achievement-oriented bullet points.
4.  Review for ATS compliance and keyword density.

Generate the resume section now:
"""
        return prompt

    @staticmethod
    def build_cover_letter_prompt(
        user_profile: dict,
        job_description: str,
        company_intelligence: dict,
        recipient_name: str = "Hiring Manager",
        tone: str = "professional and enthusiastic"
    ) -> str:
        """Builds a prompt for generating a tailored cover letter.

        Args:
            user_profile: Dictionary containing the user's master resume/profile data.
            job_description: The full text of the job description.
            company_intelligence: The fused Company Intelligence Profile.
            recipient_name: Name of the recipient for the cover letter.
            tone: Desired tone for the cover letter.

        Returns:
            A formatted string representing the LLM prompt for cover letter generation.
        """
        prompt = f"""You are an expert cover letter writer. Draft a highly tailored cover letter for the user applying to the position described.

User Profile:
{user_profile}

Job Description:
{job_description}

Company Intelligence Profile:
{company_intelligence}

Instructions:
-   Address the letter to {recipient_name}.
-   Maintain a {tone} tone.
-   Clearly articulate why the user is a strong fit for this specific role and company.
-   Reference specific points from the job description and the user's profile.
-   Showcase understanding of the company's mission/values (from intelligence profile).

Chain-of-Thought:
1.  Identify the core requirements and company values.
2.  Select 2-3 key experiences from the User Profile that directly align.
3.  Draft an engaging opening, body paragraphs connecting experience to requirements, and a strong closing.
4.  Ensure the letter is concise and impactful.

Generate the cover letter now:
"""
        return prompt

# Example Usage (for local testing)
if __name__ == "__main__":
    sample_user_profile = {
        "name": "Adrian Wedd",
        "experience": "10 years in AI/ML, autonomous systems, software architecture",
        "skills": ["Python", "TensorFlow", "Kubernetes"]
    }
    sample_job_description = "Seeking a Senior AI Engineer with expertise in autonomous agents and cloud platforms."
    sample_company_intelligence = {
        "company_name": "InnovateAI",
        "industry": "AI/ML",
        "tech_stack": ["Python", "AWS", "Kubernetes"],
        "mission": "Building the future of autonomous systems."
    }

    # Test Synthesis Prompt
    synthesis_prompt = PromptBuilder.build_synthesis_prompt(
        user_profile=sample_user_profile,
        job_description=sample_job_description,
        company_intelligence=sample_company_intelligence,
        instructions="Generate a compelling professional summary.",
        cot_reasoning="First, identify key themes. Second, synthesize into 3 sentences."
    )
    print("\n--- Synthesis Prompt ---")
    print(synthesis_prompt)

    # Test ATS Resume Prompt
    ats_resume_prompt = PromptBuilder.build_ats_resume_prompt(
        user_profile=sample_user_profile,
        job_description=sample_job_description,
        company_intelligence=sample_company_intelligence,
        target_format="plain_text",
        focus_areas=["autonomous systems", "cloud platforms"]
    )
    print("\n--- ATS Resume Prompt ---")
    print(ats_resume_prompt)

    # Test Cover Letter Prompt
    cover_letter_prompt = PromptBuilder.build_cover_letter_prompt(
        user_profile=sample_user_profile,
        job_description=sample_job_description,
        company_intelligence=sample_company_intelligence,
        recipient_name="Dr. Jane Doe",
        tone="enthusiastic and concise"
    )
    print("\n--- Cover Letter Prompt ---")
    print(cover_letter_prompt)
