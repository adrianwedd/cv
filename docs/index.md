# Introduction

Welcome to the documentation for the **AI-enhanced CV System**! This project represents a next-generation approach to professional CV management, transforming a static document into a dynamic, continuously updated, and intelligently optimized professional portfolio.

## Project Overview

The AI-enhanced CV system is a sophisticated application designed to automate the creation, enhancement, and deployment of a personalized curriculum vitae. It integrates real cross-repo GitHub activity evidence with AI capabilities (via a provider-neutral client — OpenRouter by default, Ollama or Gemini alternatively) to propose content improvements, which are verified against the evidence before they can enter the CV. The entire process is orchestrated through GitHub Actions, ensuring continuous integration and delivery of your professional story.

## Core Vision

Our core vision is to create a **living document** that evolves in tandem with your professional journey. Your career, much like a software project, is continuously integrated with new skills (commits) and deployed for new opportunities (interviews). This system ensures your CV is always current, professionally polished, and ready for viewing, reflecting your latest achievements and expertise.

## Key Features

The system is built on three pillars, ensuring a comprehensive and dynamic CV:

1.  **Evidence Collection**: Quantifying your work.
    *   Automated cross-repo collection of GitHub activity (commits, repositories, languages, contribution heatmap).
    *   Commits only on material change, keeping the evidence honest and the git history clean.
2.  **AI Enhancement, Verified**: Articulating your value.
    *   An AI provider proposes improved wording for professional summaries and experience/project descriptions, bounded by the collected evidence.
    *   Every proposal is verified — unsupported numbers, invented credentials, corporate filler, and drastic rewrites are rejected before anything touches the CV.
3.  **Automated Generation**: Presenting your story.
    *   Generates a dynamic, responsive web-based CV.
    *   Automated PDF generation (full and ATS-optimized versions) for easy sharing.

## Research & Insights

This section contains detailed research papers and insights that informed earlier iterations of the system. (Note: these predate the current provider-neutral pipeline — the Anthropic Claude integration they discuss has since been retired.)

*   [Architecting Intelligence: A Framework for Advanced Prompt and Pipeline Engineering with Anthropic's Claude for the Autonomous Career Agent](research/claude-prompt-engineering-framework.md)
*   [Prompt Engineering Strategy for Claude AI](prompt_construction.md)

## Getting Started

To explore the project or set up your development environment, please refer to the [Contribution Guidelines](contributing.md) for detailed instructions.
