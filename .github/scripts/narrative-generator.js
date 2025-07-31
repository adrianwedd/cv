#!/usr/bin/env node

/**
 * Professional Narrative Generator
 * 
 * Converts GitHub intelligence data into compelling, evidence-backed
 * professional narratives for CV enhancement. Transforms raw data patterns
 * into authentic professional stories with verifiable achievements.
 * 
 * Features:
 * - Evidence-backed professional summary generation
 * - Technical expertise validation with concrete examples
 * - Leadership and collaboration story extraction
 * - Quantified achievement generation from actual data
 * - Authentic skill progression narratives
 * 
 * Usage: node narrative-generator.js
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Professional Narrative Generator
 * 
 * Transforms GitHub intelligence data into compelling professional narratives
 * with evidence-backed claims and authentic achievement stories
 */
class NarrativeGenerator {
    constructor() {
        this.intelligenceDir = 'data/intelligence';
        this.outputDir = 'data/narratives';
        this.narratives = {
            professional_summary: null,
            technical_achievements: [],
            leadership_examples: [],
            collaboration_stories: [],
            skill_validations: [],
            growth_narrative: null
        };
    }

    /**
     * Generate comprehensive professional narratives
     */
    async generateNarratives() {
        console.log('📖 **PROFESSIONAL NARRATIVE GENERATION INITIATED**');
        console.log('');

        try {
            // Ensure output directory exists
            await fs.mkdir(this.outputDir, { recursive: true });

            // Load intelligence data
            const intelligenceData = await this.loadIntelligenceData();
            
            if (!intelligenceData) {
                console.log('⚠️ No intelligence data found. Run github-data-miner.js first.');
                return;
            }

            // Generate different types of narratives
            console.log('📝 Generating professional summary narrative...');
            this.narratives.professional_summary = this.generateProfessionalSummary(intelligenceData);

            console.log('🎯 Extracting technical achievement stories...');
            this.narratives.technical_achievements = this.extractTechnicalAchievements(intelligenceData);

            console.log('🤝 Creating leadership and collaboration narratives...');
            this.narratives.leadership_examples = this.extractLeadershipExamples(intelligenceData);
            this.narratives.collaboration_stories = this.extractCollaborationStories(intelligenceData);

            console.log('✅ Generating skill validation evidence...');
            this.narratives.skill_validations = this.generateSkillValidations(intelligenceData);

            console.log('📈 Creating professional growth narrative...');
            this.narratives.growth_narrative = this.generateGrowthNarrative(intelligenceData);

            // Save narratives
            await this.saveNarratives();

            console.log('✅ Professional narratives generated successfully');
            return this.narratives;

        } catch (error) {
            console.error('❌ Narrative generation failed:', error.message);
            throw error;
        }
    }

    /**
     * Load latest intelligence data
     */
    async loadIntelligenceData() {
        try {
            // Find the latest intelligence file
            const files = await fs.readdir(this.intelligenceDir);
            const intelligenceFiles = files.filter(f => f.startsWith('github-intelligence-') && f.endsWith('.json'));
            
            if (intelligenceFiles.length === 0) {
                return null;
            }

            // Sort by filename (which includes timestamp) and get latest
            const latestFile = intelligenceFiles.sort().pop();
            const filePath = path.join(this.intelligenceDir, latestFile);
            
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            
            console.log(`📊 Loaded intelligence data from: ${latestFile}`);
            return data;

        } catch (error) {
            console.warn('⚠️ Failed to load intelligence data:', error.message);
            return null;
        }
    }

    /**
     * Generate evidence-backed professional summary
     */
    generateProfessionalSummary(intelligence) {
        const issues = intelligence.issues_intelligence || {};
        const commits = intelligence.commits_intelligence || {};
        const prs = intelligence.prs_intelligence || {};

        const totalIssues = issues.summary_metrics?.total_issues_analyzed || 0;
        const totalCommits = commits.summary_metrics?.total_commits_analyzed || 0;
        const technicalDepth = issues.summary_metrics?.technical_depth_score || 0;
        const collaborationScore = issues.summary_metrics?.collaboration_score || 0;

        // Generate evidence-backed claims
        const evidenceBasedClaims = [];

        if (totalIssues > 10) {
            evidenceBasedClaims.push(`contributed to technical discussions across ${totalIssues}+ GitHub issues`);
        }

        if (totalCommits > 20) {
            evidenceBasedClaims.push(`authored ${totalCommits}+ commits demonstrating consistent development activity`);
        }

        if (technicalDepth > 60) {
            evidenceBasedClaims.push(`demonstrates high technical depth with ${technicalDepth}% of contributions involving complex technical solutions`);
        }

        if (collaborationScore > 50) {
            evidenceBasedClaims.push(`maintains ${collaborationScore}% collaboration effectiveness in community interactions`);
        }

        // Extract technical themes from commit patterns
        const technicalThemes = this.extractTechnicalThemes(intelligence);
        const problemSolvingExamples = this.extractProblemSolvingExamples(intelligence);

        return {
            enhanced_summary: this.constructProfessionalSummary(evidenceBasedClaims, technicalThemes),
            evidence_sources: {
                issues_analyzed: totalIssues,
                commits_analyzed: totalCommits,
                technical_depth_score: technicalDepth,
                collaboration_score: collaborationScore
            },
            supporting_data: {
                technical_themes: technicalThemes,
                problem_solving_examples: problemSolvingExamples.slice(0, 3) // Top 3 examples
            }
        };
    }

    /**
     * Construct professional summary from evidence
     */
    constructProfessionalSummary(evidenceClaims, technicalThemes) {
        const themeList = technicalThemes.slice(0, 3).join(', ');
        const evidenceText = evidenceClaims.length > 0 ? evidenceClaims.join(', ') : 'demonstrates consistent technical contribution';

        return `AI Engineer and Software Architect with proven track record in ${themeList}. Evidence from GitHub activity shows I have ${evidenceText}. Specializes in creating intelligent solutions that bridge theoretical AI/ML concepts with production-ready implementations, with particular focus on autonomous systems and human-AI collaboration frameworks.`;
    }

    /**
     * Extract technical themes from commit and issue patterns
     */
    extractTechnicalThemes(intelligence) {
        const themes = new Set();
        
        // Extract from commit messages
        const commits = intelligence.commits_intelligence?.development_philosophy || [];
        commits.forEach(commit => {
            const message = commit.message?.toLowerCase() || '';
            if (message.includes('ai') || message.includes('ml') || message.includes('machine learning')) {
                themes.add('machine learning');
            }
            if (message.includes('api') || message.includes('backend') || message.includes('server')) {
                themes.add('backend development');
            }
            if (message.includes('frontend') || message.includes('ui') || message.includes('react')) {
                themes.add('frontend development');
            }
            if (message.includes('docker') || message.includes('deploy') || message.includes('ci')) {
                themes.add('DevOps');
            }
            if (message.includes('test') || message.includes('quality')) {
                themes.add('software quality');
            }
            if (message.includes('performance') || message.includes('optimize')) {
                themes.add('performance optimization');
            }
        });

        // Extract from issue discussions
        const issues = intelligence.issues_intelligence?.technical_discussions || [];
        issues.forEach(issue => {
            const content = (issue.title + ' ' + issue.body_excerpt).toLowerCase();
            if (content.includes('architecture') || content.includes('design')) {
                themes.add('software architecture');
            }
            if (content.includes('automation') || content.includes('workflow')) {
                themes.add('automation');
            }
            if (content.includes('security')) {
                themes.add('security');
            }
        });

        return Array.from(themes);
    }

    /**
     * Extract problem-solving examples from issues and commits
     */
    extractProblemSolvingExamples(intelligence) {
        const examples = [];
        
        // From issue discussions
        const issues = intelligence.issues_intelligence?.technical_discussions || [];
        issues.forEach((issue, index) => {
            if (issue.complexity_level === 'high' || issue.technical_score >= 3) {
                examples.push({
                    type: 'issue_resolution',
                    repository: issue.repository,
                    title: issue.title,
                    complexity: issue.complexity_level,
                    technical_score: issue.technical_score,
                    evidence_link: `github.com/adrianwedd/${issue.repository}/issues/${issue.issue_number}`
                });
            }
        });

        // From commit patterns
        const commits = intelligence.commits_intelligence?.development_philosophy || [];
        commits.forEach(commit => {
            if (commit.commit_type === 'bugfix' || commit.commit_type === 'refactor') {
                examples.push({
                    type: 'code_improvement',
                    repository: commit.repository,
                    message: commit.message,
                    commit_type: commit.commit_type,
                    philosophy_score: commit.philosophy_score,
                    evidence_link: `github.com/adrianwedd/${commit.repository}/commit/${commit.sha}`
                });
            }
        });

        return examples.sort((a, b) => (b.technical_score || b.philosophy_score || 0) - (a.technical_score || a.philosophy_score || 0));
    }

    /**
     * Extract technical achievements with evidence
     */
    extractTechnicalAchievements(intelligence) {
        const achievements = [];
        
        const issues = intelligence.issues_intelligence?.summary_metrics || {};
        const commits = intelligence.commits_intelligence?.summary_metrics || {};
        const prs = intelligence.prs_intelligence?.summary_metrics || {};

        // Technical contribution achievements
        if (issues.total_issues_analyzed > 0) {
            achievements.push({
                achievement: `Contributed to ${issues.total_issues_analyzed} technical discussions`,
                evidence_type: 'issue_participation',
                impact_score: Math.min(100, issues.total_issues_analyzed * 2),
                details: `Participated in technical discussions across multiple repositories, with ${issues.technical_depth_score}% involving complex technical solutions`
            });
        }

        if (commits.total_commits_analyzed > 0) {
            achievements.push({
                achievement: `Authored ${commits.total_commits_analyzed} commits in recent period`,
                evidence_type: 'development_activity',
                impact_score: Math.min(100, commits.total_commits_analyzed),
                details: 'Consistent development activity showing sustained contribution to codebase evolution'
            });
        }

        if (prs.reviews_given > 0) {
            achievements.push({
                achievement: `Provided ${prs.reviews_given} code reviews`,
                evidence_type: 'technical_leadership',
                impact_score: prs.reviews_given * 5,
                details: 'Demonstrates technical leadership through active participation in code review process'
            });
        }

        // Repository-specific achievements
        const repoAchievements = this.extractRepositoryAchievements(intelligence);
        achievements.push(...repoAchievements);

        return achievements.sort((a, b) => b.impact_score - a.impact_score);
    }

    /**
     * Extract repository-specific achievements
     */
    extractRepositoryAchievements(intelligence) {
        const achievements = [];
        const repoData = new Map();

        // Aggregate data by repository
        const issues = intelligence.issues_intelligence?.technical_discussions || [];
        const commits = intelligence.commits_intelligence?.development_philosophy || [];

        issues.forEach(issue => {
            if (!repoData.has(issue.repository)) {
                repoData.set(issue.repository, { issues: 0, commits: 0, complexity: [] });
            }
            const data = repoData.get(issue.repository);
            data.issues++;
            data.complexity.push(issue.complexity_level);
        });

        commits.forEach(commit => {
            if (!repoData.has(commit.repository)) {
                repoData.set(commit.repository, { issues: 0, commits: 0, complexity: [] });
            }
            const data = repoData.get(commit.repository);
            data.commits++;
        });

        // Generate achievements for significant repositories
        repoData.forEach((data, repo) => {
            if (data.issues > 3 || data.commits > 10) {
                const highComplexity = data.complexity.filter(c => c === 'high').length;
                achievements.push({
                    achievement: `Led technical development in ${repo} repository`,
                    evidence_type: 'repository_leadership',
                    impact_score: data.issues * 3 + data.commits + highComplexity * 5,
                    details: `${data.commits} commits, ${data.issues} technical discussions, ${highComplexity} high-complexity issues resolved`,
                    repository: repo
                });
            }
        });

        return achievements;
    }

    /**
     * Extract leadership examples from PR reviews and issue interactions
     */
    extractLeadershipExamples(intelligence) {
        const examples = [];
        
        const prData = intelligence.prs_intelligence || {};
        const reviewsGiven = prData.summary_metrics?.reviews_given || 0;
        const mentoringExamples = prData.technical_mentoring || [];

        if (reviewsGiven > 0) {
            examples.push({
                leadership_type: 'code_review_leadership',
                example: `Provided ${reviewsGiven} code reviews demonstrating technical leadership`,
                evidence_strength: 'high',
                impact: 'Helped maintain code quality and mentored team members through review process',
                quantified_metrics: `${reviewsGiven} reviews across multiple repositories`
            });
        }

        // Extract specific mentoring examples
        mentoringExamples.forEach(example => {
            if (example.leadership_score > 0) {
                examples.push({
                    leadership_type: 'technical_mentoring',
                    example: `Provided technical guidance in ${example.repository} repository`,
                    evidence_strength: example.leadership_score > 2 ? 'high' : 'medium',
                    impact: example.review_excerpt,
                    repository: example.repository,
                    date: example.submitted_at
                });
            }
        });

        return examples;
    }

    /**
     * Extract collaboration stories from issue comments and discussions
     */
    extractCollaborationStories(intelligence) {
        const stories = [];
        
        const collaborationExamples = intelligence.issues_intelligence?.collaboration_examples || [];
        const collaborationScore = intelligence.issues_intelligence?.summary_metrics?.collaboration_score || 0;

        if (collaborationScore > 50) {
            stories.push({
                story_type: 'community_collaboration',
                narrative: `Maintains ${collaborationScore}% collaboration effectiveness in community interactions`,
                evidence: `Consistently provides helpful responses in technical discussions`,
                impact: 'Contributes to positive community environment and knowledge sharing'
            });
        }

        // Extract specific collaboration examples
        collaborationExamples.forEach(example => {
            if (example.mentoring_score > 0 || example.helpfulness_level === 'high') {
                stories.push({
                    story_type: 'technical_assistance',
                    narrative: `Provided technical assistance in ${example.repository}`,
                    evidence: example.comment_excerpt,
                    helpfulness_level: example.helpfulness_level,
                    response_type: example.response_type,
                    repository: example.repository
                });
            }
        });

        return stories;
    }

    /**
     * Generate skill validations with evidence
     */
    generateSkillValidations(intelligence) {
        const validations = [];
        const skillEvidence = new Map();

        // Analyze commit patterns for skill evidence
        const commits = intelligence.commits_intelligence?.development_philosophy || [];
        commits.forEach(commit => {
            const message = commit.message?.toLowerCase() || '';
            const repo = commit.repository;
            
            // Language/tech skill detection
            if (message.includes('javascript') || message.includes('js') || message.includes('react')) {
                this.addSkillEvidence(skillEvidence, 'JavaScript', repo, 'commit', commit.date);
            }
            if (message.includes('python') || message.includes('py')) {
                this.addSkillEvidence(skillEvidence, 'Python', repo, 'commit', commit.date);
            }
            if (message.includes('docker') || message.includes('container')) {
                this.addSkillEvidence(skillEvidence, 'Docker', repo, 'commit', commit.date);
            }
            if (message.includes('api') || message.includes('backend')) {
                this.addSkillEvidence(skillEvidence, 'API Development', repo, 'commit', commit.date);
            }
            if (message.includes('test') || message.includes('testing')) {
                this.addSkillEvidence(skillEvidence, 'Testing', repo, 'commit', commit.date);
            }
        });

        // Analyze issue discussions for skill evidence
        const issues = intelligence.issues_intelligence?.technical_discussions || [];
        issues.forEach(issue => {
            const content = (issue.title + ' ' + issue.body_excerpt).toLowerCase();
            const repo = issue.repository;
            
            if (content.includes('architecture') || content.includes('design')) {
                this.addSkillEvidence(skillEvidence, 'Software Architecture', repo, 'issue', issue.created_at);
            }
            if (content.includes('performance') || content.includes('optimization')) {
                this.addSkillEvidence(skillEvidence, 'Performance Optimization', repo, 'issue', issue.created_at);
            }
            if (content.includes('security')) {
                this.addSkillEvidence(skillEvidence, 'Security', repo, 'issue', issue.created_at);
            }
        });

        // Convert evidence to validations
        skillEvidence.forEach((evidence, skill) => {
            if (evidence.count >= 2) { // Minimum evidence threshold
                validations.push({
                    skill: skill,
                    evidence_strength: evidence.count >= 5 ? 'strong' : evidence.count >= 3 ? 'medium' : 'basic',
                    evidence_count: evidence.count,
                    repositories: [...evidence.repositories],
                    evidence_types: [...evidence.types],
                    recent_usage: evidence.dates.sort().pop(), // Most recent
                    validation_summary: `${skill} skill demonstrated through ${evidence.count} instances across ${evidence.repositories.size} repositories`
                });
            }
        });

        return validations.sort((a, b) => b.evidence_count - a.evidence_count);
    }

    /**
     * Helper method to add skill evidence
     */
    addSkillEvidence(skillEvidence, skill, repository, type, date) {
        if (!skillEvidence.has(skill)) {
            skillEvidence.set(skill, {
                count: 0,
                repositories: new Set(),
                types: new Set(),
                dates: []
            });
        }
        
        const evidence = skillEvidence.get(skill);
        evidence.count++;
        evidence.repositories.add(repository);
        evidence.types.add(type);
        evidence.dates.push(date);
    }

    /**
     * Generate professional growth narrative
     */
    generateGrowthNarrative(intelligence) {
        const commits = intelligence.commits_intelligence?.development_philosophy || [];
        const issues = intelligence.issues_intelligence?.technical_discussions || [];

        // Analyze temporal patterns
        const timelineData = this.analyzeGrowthTimeline(commits, issues);
        
        return {
            growth_summary: 'Demonstrates consistent professional development through increasing technical complexity and community engagement',
            key_indicators: [
                'Steady increase in technical contribution complexity',
                'Growing involvement in architectural discussions',
                'Evolution from individual contributor to community collaborator'
            ],
            timeline_highlights: timelineData.highlights,
            metrics_progression: timelineData.metrics,
            future_trajectory: 'Positioned for senior technical leadership roles based on demonstrated growth patterns'
        };
    }

    /**
     * Analyze growth timeline from data patterns
     */
    analyzeGrowthTimeline(commits, issues) {
        const highlights = [];
        const metrics = {};

        // Simple timeline analysis (can be enhanced with more sophisticated date analysis)
        if (commits.length > 0) {
            highlights.push(`${commits.length} commits showing consistent development activity`);
        }

        if (issues.length > 0) {
            const highComplexity = issues.filter(i => i.complexity_level === 'high').length;
            if (highComplexity > 0) {
                highlights.push(`${highComplexity} high-complexity technical discussions`);
            }
        }

        // Calculate basic metrics
        metrics.technical_evolution_score = Math.min(100, (commits.length * 2) + (issues.length * 3));
        metrics.complexity_trend = issues.filter(i => i.complexity_level === 'high').length > 0 ? 'increasing' : 'stable';
        metrics.contribution_consistency = commits.length > 10 ? 'high' : commits.length > 5 ? 'medium' : 'developing';

        return { highlights, metrics };
    }

    /**
     * Save generated narratives to files
     */
    async saveNarratives() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            console.log(`💾 Saving narratives to ${this.outputDir}...`);
            
            // Ensure output directory exists
            await fs.mkdir(this.outputDir, { recursive: true });
            console.log(`📁 Narratives directory ensured: ${this.outputDir}`);
            
            // Save comprehensive narratives
            const narrativesPath = path.join(this.outputDir, `professional-narratives-${timestamp}.json`);
            await fs.writeFile(narrativesPath, JSON.stringify(this.narratives, null, 2), 'utf8');
            
            // Verify file was written
            const narrativeStats = await fs.stat(narrativesPath);
            console.log(`📄 Narratives saved: ${narrativesPath} (${narrativeStats.size} bytes)`);
            
            // Save summary for integration
            const integration = {
                generated_at: new Date().toISOString(),
                narratives_available: {
                    professional_summary: !!this.narratives.professional_summary,
                    technical_achievements: this.narratives.technical_achievements.length,
                    leadership_examples: this.narratives.leadership_examples.length,
                    collaboration_stories: this.narratives.collaboration_stories.length,
                    skill_validations: this.narratives.skill_validations.length,
                    growth_narrative: !!this.narratives.growth_narrative
                },
                integration_ready: true,
                enhanced_summary: this.narratives.professional_summary?.enhanced_summary || null,
                top_achievements: this.narratives.technical_achievements.slice(0, 3),
                validated_skills: this.narratives.skill_validations.slice(0, 5).map(v => v.skill)
            };
            
            const integrationPath = path.join(this.outputDir, 'narrative-integration.json');
            await fs.writeFile(integrationPath, JSON.stringify(integration, null, 2), 'utf8');
            
            // Verify integration file was written
            const integrationStats = await fs.stat(integrationPath);
            console.log(`🔗 Integration data saved: ${integrationPath} (${integrationStats.size} bytes)`);
            
            // List all files in output directory for verification
            const outputFiles = await fs.readdir(this.outputDir);
            console.log(`📋 Files in narratives directory: ${outputFiles.join(', ')}`);
            
        } catch (error) {
            console.error('❌ Failed to save narrative data:', error);
            throw error;
        }
    }
}

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('📖 Professional Narrative Generator');
        console.log('==================================');
        console.log('');
        
        const generator = new NarrativeGenerator();
        const narratives = await generator.generateNarratives();
        
        if (narratives) {
            console.log('');
            console.log('🎯 **NARRATIVE GENERATION SUMMARY**');
            console.log(`📝 Professional summary: ${narratives.professional_summary ? '✅' : '❌'}`);
            console.log(`🏆 Technical achievements: ${narratives.technical_achievements.length}`);
            console.log(`👥 Leadership examples: ${narratives.leadership_examples.length}`);
            console.log(`🤝 Collaboration stories: ${narratives.collaboration_stories.length}`);
            console.log(`✅ Skill validations: ${narratives.skill_validations.length}`);
            console.log(`📈 Growth narrative: ${narratives.growth_narrative ? '✅' : '❌'}`);
        }
        
    } catch (error) {
        console.error('❌ Narrative generation failed:', error.message);
        process.exit(1);
    }
}

// Execute if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { NarrativeGenerator };