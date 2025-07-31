# Prompt Engineering Strategy for Claude AI

This document outlines the core principles and techniques for constructing effective prompts for Anthropic's Claude models within the AI-enhanced CV system. It builds upon the foundational concepts detailed in `docs/research/claude-prompt-engineering-framework.md`.

Our prompt engineering strategy focuses on ensuring clarity, control, and consistency in Claude's outputs, enabling reliable and strategically effective content generation.

## 1. Foundational Prompting Architecture

The following principles are fundamental to all Claude prompts in this system:

### 1.1. The Primacy of Clear and Direct Instructions

Prompts must be explicit, specific, and direct. Avoid ambiguity by clearly stating *what* Claude should do and *how* it should do it. Frame instructions positively, focusing on the desired outcome.

**Example:**
Instead of: "Improve this resume bullet point."
Use: "Rewrite the following resume bullet point to emphasize quantifiable achievements and align with the skills mentioned in the provided job description. Use the STAR (Situation, Task, Action, Result) method for the structure."

### 1.2. Structuring Prompts with XML Tags

Claude models are fine-tuned to recognize and prioritize information structured within XML tags. This creates explicit boundaries for different parts of the prompt, preventing confusion between instructions and content.

**Recommended Tags:**
*   `<instructions>`: For the main task description.
*   `<context>`: For providing background information or data.
*   `<examples>`: For few-shot examples.
*   `<input>` or specific content tags like `<resume_text>`, `<job_description>`: For the data Claude needs to process.
*   `<output_format>`: To specify the desired output structure (e.g., JSON schema).
*   `<thinking>`: (For Chain-of-Thought) To instruct Claude to show its reasoning process.

**Example Structure:**
```xml
<instructions>
  You are an expert career coach. Your task is to analyze the provided resume and job description. Identify the top 5 skills from the job description that are missing from the resume. List them in a JSON array.
</instructions>

<resume_text>
  [...Paste the full text of the resume here...]
</resume_text>

<job_description>
  [...Paste the full text of the job description here...]
</job_description>
```

### 1.3. Guiding Behavior with Few-Shot Prompting (Examples)

Provide 3-5 diverse and relevant examples within the prompt to show Claude *how* to perform a task. Examples help the model infer patterns, formats, tones, and logical steps, improving accuracy and consistency.

**Example:**
```xml
<instructions>
  Rewrite the resume bullet points in the <before> tags to be more impactful and quantifiable, following the style of the examples.
</instructions>

<examples>
  <example>
    <before>Responsible for managing the company's social media accounts.</before>
    <after>Grew social media engagement by 35% across three platforms (Twitter, LinkedIn, Facebook) over 6 months by implementing a data-driven content strategy.</after>
  </example>
</examples>

<task>
  <before>[User's bullet point to be improved]</before>
  <after>
</task>
```

### 1.4. Establishing Persona and Tone with System Prompts

Use the `system` parameter in the Messages API to assign a specific role, persona, and tone to Claude. This transforms the model into a domain-specific expert, ensuring outputs are contextually appropriate.

**Examples of System Prompts:**
*   For resume analysis: `"You are an expert career coach and resume writer with 20 years of experience helping tech professionals land jobs at top-tier companies."`
*   For company research: `"You are a meticulous financial analyst and business strategist. Your task is to analyze company data and provide objective, data-driven insights."`

## 2. Advanced Reasoning and Task Decomposition

For complex tasks, combine foundational principles with advanced frameworks:

### 2.1. Chain-of-Thought (CoT) Prompting

Instruct Claude to "think step-by-step" before providing a final answer. Structured CoT uses XML tags (`<thinking>`) to separate the reasoning process from the final answer, making the AI's logic transparent and debuggable.

**Example of Structured CoT:**
```xml
<instructions>
  Analyze the following job description and determine the top 3 most critical skills.
  Place your reasoning within <thinking> tags and the final answer within <answer> tags.
</instructions>

<job_description>
  ...
</job_description>

<thinking>
  First, I will identify all skills mentioned.
  Second, I will categorize them as mandatory or desirable.
  Third, I will rank the mandatory skills by frequency and importance.
</thinking>

<answer>
  The top 3 most critical skills are: [Skill 1, Skill 2, Skill 3].
</answer>
```

### 2.2. Prompt Chaining

Break down complex tasks into a sequence of smaller, single-purpose prompts, where the output of one prompt serves as the input for the next. This modular approach increases reliability and manageability for multi-step workflows.

### 2.3. "Tool Use" Paradigm for Enforcing JSON Schema

For the most reliable structured data extraction, define "tools" with JSON schemas. Instruct Claude to "call" these tools, populating their arguments with extracted data. This guarantees schema conformity.

**Example of Tool Use Schema:**
```json
{
  "name": "extract_job_details",
  "description": "Extracts key information from a job description.",
  "input_schema": {
    "type": "object",
    "properties": {
      "job_title": {
        "type": "string",
        "description": "The official title of the position."
      },
      "company_name": {
        "type": "string",
        "description": "The name of the hiring company."
      }
    },
    "required": ["job_title", "company_name"]
  }
}
```

## 3. Ethical Considerations in Prompting

Integrate ethical guardrails directly into prompts to mitigate bias and ensure responsible AI outputs:

### 3.1. Prompting for Fairness and Bias Detection

Task Claude with reviewing its own output or source data for potential bias or exclusionary language.

**Example:**
"You are an expert in Diversity, Equity, and Inclusion (DEI). Review the following job description for any language, phrases, or requirements that might unintentionally discourage qualified applicants from underrepresented groups. Suggest more inclusive alternatives for any problematic language you identify."

### 3.2. Allowing for Uncertainty

Explicitly give Claude permission to state when it does not know an answer, preventing it from fabricating information.

**Example:**
"If the Q3 revenue is not mentioned in the report, state 'I don't have enough information to answer the question.'"

## 4. Version-Controlled Prompt Library

All prompts should be managed as code within a dedicated library in the project's repository. This ensures consistency, facilitates A/B testing, and allows for systematic iteration and improvement.

---

**Reference Document:** `docs/research/claude-prompt-engineering-framework.md`