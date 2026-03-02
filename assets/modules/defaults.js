/**
 * Default data providers for when remote data is unavailable.
 */

export function getDefaultExperience() {
    return [
        {
            position: "Applications Specialist / Acting Senior Change Analyst",
            company: "Homes Tasmania",
            period: "2018 - Present",
            description: "Complex socio-technical systems analysis for Tasmania's housing and community services portfolio. Developed Homes Tasmania's first Generative AI usage policy in 2023.",
            achievements: [
                "Developed Homes Tasmania's GenAI usage policy, procedure, and training materials",
                "Led cybersecurity initiatives improving system security",
                "Systems integration and API development using RESTful APIs and Python"
            ],
            technologies: ["Python", "PowerShell", "JavaScript", "RESTful APIs", "Azure"]
        }
    ];
}

export function getDefaultProjects() {
    return [
        {
            name: "Failure-First Embodied AI",
            description: "Red-teaming and benchmarking framework for embodied and agentic AI systems.",
            technologies: ["Python", "AI Safety", "Red-teaming"],
            github: "https://github.com/adrianwedd/failure-first-embodied-ai"
        },
        {
            name: "TEL3SIS",
            description: "Real-time telephony platform with LLM-powered conversations and safety oracle.",
            technologies: ["Python", "Vocode", "Whisper"],
            github: "https://github.com/adrianwedd/TEL3SIS"
        }
    ];
}

export function getDefaultSkills() {
    return [
        { name: "Python", category: "Programming Languages", tier: "Primary" },
        { name: "JavaScript / TypeScript", category: "Programming Languages", tier: "Primary" },
        { name: "Frontier AI Models", category: "AI & Safety", tier: "Primary" },
        { name: "Red-Teaming", category: "AI & Safety", tier: "Primary" },
        { name: "Evaluation Frameworks", category: "AI & Safety", tier: "Primary" },
        { name: "Systems Integration", category: "Infrastructure", tier: "Primary" },
        { name: "Cybersecurity", category: "Infrastructure", tier: "Primary" },
        { name: "Risk Assessment", category: "Research Methods", tier: "Primary" },
        { name: "Technical Writing", category: "Research Methods", tier: "Primary" }
    ];
}

export function getDefaultAchievements() {
    return [
        {
            title: "Failure-First Research Program",
            description: "Developed comprehensive failure-first evaluation methodology for agentic AI systems.",
            date: "2022-Present"
        },
        {
            title: "Published Research: Organisational AI Governance",
            description: "Published research on structural barriers to acting on AI safety evidence in organisations.",
            date: "2025"
        },
        {
            title: "AI Governance Policy Development",
            description: "Developed Homes Tasmania's first Generative AI usage policy and training materials.",
            date: "2023"
        }
    ];
}

export function getDefaultCVData() {
    return {
        professional_summary: "AI Safety Engineer and Independent Researcher. Three years empirical research on frontier AI models, focused on red-teaming, evaluation frameworks, and failure-first methodology. Seven years translating complex technical findings into actionable insights for government decision-makers.",
        experience: getDefaultExperience(),
        projects: getDefaultProjects(),
        skills: getDefaultSkills(),
        achievements: getDefaultAchievements()
    };
}
