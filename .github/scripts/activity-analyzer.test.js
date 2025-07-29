const assert = require('assert');
const { ActivityAnalyzer, CONFIG } = require('./activity-analyzer.js');

describe('ActivityAnalyzer', () => {
    let analyzer;

    beforeEach(() => {
        // Mock GITHUB_TOKEN for testing
        process.env.GITHUB_TOKEN = 'mock_token';
        analyzer = new ActivityAnalyzer();
    });

    afterEach(() => {
        delete process.env.GITHUB_TOKEN;
    });

    it('should calculate professional metrics correctly', async () => {
        // Mock client.request to return dummy data
        analyzer.client.request = async (endpoint) => {
            if (endpoint.includes('/users/')) {
                return { followers: 10, created_at: '2020-01-01T00:00:00Z' };
            } else if (endpoint.includes('/repos')) {
                return [
                    { stargazers_count: 50, forks_count: 5, language: 'JavaScript', updated_at: '2025-07-20T00:00:00Z' },
                    { stargazers_count: 20, forks_count: 2, language: 'Python', updated_at: '2025-07-25T00:00:00Z' },
                    { stargazers_count: 10, forks_count: 1, language: 'TypeScript', updated_at: '2025-07-28T00:00:00Z' }
                ];
            }
            return {};
        };

        const metrics = await analyzer.calculateProfessionalMetrics();

        assert.strictEqual(typeof metrics.scores.overall_professional_score, 'number');
        assert(metrics.scores.overall_professional_score >= 0 && metrics.scores.overall_professional_score <= 100);
        assert.strictEqual(metrics.raw_metrics.total_repositories, 3);
        assert.strictEqual(metrics.raw_metrics.total_stars, 80);
    });

    it('should analyze skill proficiency correctly', async () => {
        // Mock client.request to return dummy data
        analyzer.client.request = async (endpoint) => {
            if (endpoint.includes('/repos')) {
                return [
                    { stargazers_count: 100, forks_count: 10, language: 'Python', size: 5000, updated_at: '2025-07-20T00:00:00Z' },
                    { stargazers_count: 50, forks_count: 5, language: 'JavaScript', size: 2000, updated_at: '2025-07-25T00:00:00Z' }
                ];
            }
            return {};
        };

        const skillAnalysis = await analyzer.analyzeSkillProficiency();

        assert.strictEqual(typeof skillAnalysis.skill_proficiency.Python.proficiency_score, 'number');
        assert.strictEqual(skillAnalysis.skill_proficiency.Python.proficiency_level, 'Expert');
        assert.strictEqual(skillAnalysis.summary.total_languages, 2);
    });
});
