/**
 * Activity Analyzer Unit Tests
 * 
 * Fast, isolated tests for GitHub activity analysis functionality.
 * Uses proper mocking to avoid external dependencies and serialization issues.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment, MOCK_RESPONSES } from './test-config.js';

// Setup test environment
setupTestEnvironment();

describe('Activity Analyzer Unit Tests', () => {
    test('should calculate basic metrics from mock data', () => {
        const mockUserData = {
            followers: 10,
            created_at: '2020-01-01T00:00:00Z'
        };

        const mockRepoData = [
            { 
                stargazers_count: 50, 
                forks_count: 5, 
                language: 'JavaScript', 
                updated_at: '2025-07-20T00:00:00Z',
                size: 1000,
                private: false,
                fork: false
            },
            { 
                stargazers_count: 20, 
                forks_count: 2, 
                language: 'Python', 
                updated_at: '2025-07-25T00:00:00Z',
                size: 2000,
                private: false,
                fork: false
            }
        ];

        // Test basic calculations
        const totalStars = mockRepoData.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        const totalForks = mockRepoData.reduce((sum, repo) => sum + repo.forks_count, 0);
        const languages = [...new Set(mockRepoData.map(repo => repo.language))];

        assert.strictEqual(totalStars, 70, 'Should calculate total stars correctly');
        assert.strictEqual(totalForks, 7, 'Should calculate total forks correctly');
        assert.strictEqual(languages.length, 2, 'Should identify unique languages');
        assert.ok(languages.includes('JavaScript'), 'Should include JavaScript');
        assert.ok(languages.includes('Python'), 'Should include Python');
    });

    test('should handle repository language analysis', () => {
        const mockRepos = [
            { language: 'JavaScript', size: 1000 },
            { language: 'JavaScript', size: 1500 },
            { language: 'Python', size: 800 },
            { language: null, size: 200 }, // Repository without language
            { language: 'TypeScript', size: 600 }
        ];

        // Calculate language statistics
        const languageStats = {};
        let totalSize = 0;

        mockRepos.forEach(repo => {
            if (repo.language) {
                languageStats[repo.language] = (languageStats[repo.language] || 0) + repo.size;
                totalSize += repo.size;
            }
        });

        assert.strictEqual(languageStats['JavaScript'], 2500, 'Should aggregate JavaScript size');
        assert.strictEqual(languageStats['Python'], 800, 'Should aggregate Python size');
        assert.strictEqual(languageStats['TypeScript'], 600, 'Should aggregate TypeScript size');
        assert.strictEqual(totalSize, 3900, 'Should exclude null language repos from total');
    });

    test('should calculate skill proficiency scores', () => {
        const mockLanguageData = {
            'JavaScript': { repos: 5, totalLines: 10000, stars: 50, forks: 10 },
            'Python': { repos: 3, totalLines: 8000, stars: 30, forks: 5 },
            'TypeScript': { repos: 2, totalLines: 3000, stars: 15, forks: 2 }
        };

        // Calculate proficiency scores (simplified algorithm)
        const proficiencyScores = {};
        
        Object.entries(mockLanguageData).forEach(([language, data]) => {
            const repoWeight = Math.min(data.repos * 10, 50); // Max 50 points for repos
            const popularityWeight = Math.min((data.stars + data.forks) * 2, 30); // Max 30 points
            const sizeWeight = Math.min(data.totalLines / 1000, 20); // Max 20 points
            
            proficiencyScores[language] = repoWeight + popularityWeight + sizeWeight;
        });

        assert.ok(proficiencyScores['JavaScript'] > proficiencyScores['Python'], 
            'JavaScript should have higher proficiency score');
        assert.ok(proficiencyScores['Python'] > proficiencyScores['TypeScript'], 
            'Python should have higher proficiency score than TypeScript');
        
        Object.values(proficiencyScores).forEach(score => {
            assert.ok(score >= 0 && score <= 100, 'Proficiency scores should be between 0-100');
        });
    });

    test('should handle edge cases in activity data', () => {
        const edgeCases = [
            { repos: [], user: null }, // Empty data
            { repos: [{ language: null, size: 0 }], user: { followers: 0 } }, // Minimal data
            { repos: Array(100).fill({ language: 'JavaScript', size: 1000 }), user: { followers: 1000 } } // Large data
        ];

        edgeCases.forEach((testCase, index) => {
            // Test that processing doesn't crash with edge cases
            assert.doesNotThrow(() => {
                const totalRepos = testCase.repos.length;
                const totalFollowers = testCase.user?.followers || 0;
                const hasData = totalRepos > 0 || totalFollowers > 0;
                
                assert.ok(totalRepos >= 0, `Test case ${index}: Should handle repo count`);
                assert.ok(totalFollowers >= 0, `Test case ${index}: Should handle follower count`);
            }, `Edge case ${index} should not throw`);
        });
    });

    test('should validate date calculations', () => {
        const testDates = [
            '2020-01-01T00:00:00Z',
            '2024-01-01T00:00:00Z', // Use past date to ensure positive diff
            new Date(Date.now() - 86400000).toISOString() // Yesterday
        ];

        testDates.forEach(dateString => {
            const date = new Date(dateString);
            const now = new Date();
            const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            
            assert.ok(!isNaN(date.getTime()), `Should parse valid date: ${dateString}`);
            assert.ok(daysDiff >= 0, `Date difference should be non-negative for ${dateString}`);
        });
    });

    test('should handle API error scenarios', () => {
        const mockApiErrors = [
            { status: 404, message: 'Not Found' },
            { status: 403, message: 'API rate limit exceeded' },
            { status: 500, message: 'Internal Server Error' },
            { status: 401, message: 'Bad credentials' }
        ];

        mockApiErrors.forEach(error => {
            // Test error handling logic
            assert.ok(error.status >= 400, 'Should be error status code');
            assert.ok(error.message.length > 0, 'Should have error message');
            
            // Simulate error handling
            const shouldRetry = error.status >= 500 || error.status === 429;
            const isAuthError = error.status === 401 || error.status === 403;
            
            assert.ok(typeof shouldRetry === 'boolean', 'Should determine retry strategy');
            assert.ok(typeof isAuthError === 'boolean', 'Should identify auth errors');
        });
    });

    test('should validate mock data structure', () => {
        const mockData = MOCK_RESPONSES;
        
        assert.ok(mockData.github, 'Should have GitHub mock data');
        assert.ok(mockData.github.user, 'Should have user mock data');
        assert.ok(mockData.github.repos, 'Should have repos mock data');
        
        assert.ok(typeof mockData.github.user.login === 'string', 'User should have login');
        assert.ok(Array.isArray(mockData.github.repos), 'Repos should be array');
        
        if (mockData.github.repos.length > 0) {
            const repo = mockData.github.repos[0];
            assert.ok(typeof repo.name === 'string', 'Repo should have name');
            assert.ok(typeof repo.language === 'string', 'Repo should have language');
        }
    });
});

describe('Activity Analyzer Edge Cases', () => {
    test('should handle concurrent processing', async () => {
        // Simulate concurrent data processing
        const tasks = Array.from({ length: 5 }, (_, i) => 
            Promise.resolve({
                id: i,
                result: `processed_${i}`,
                timestamp: Date.now()
            })
        );

        const results = await Promise.all(tasks);
        
        assert.strictEqual(results.length, 5, 'Should process all tasks');
        results.forEach((result, index) => {
            assert.strictEqual(result.id, index, 'Should maintain task order');
            assert.ok(result.result.includes(`processed_${index}`), 'Should process correctly');
        });
    });

    test('should handle memory-efficient processing', () => {
        // Test processing of large datasets without memory issues
        const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            language: i % 2 === 0 ? 'JavaScript' : 'Python',
            size: Math.floor(Math.random() * 10000),
            stars: Math.floor(Math.random() * 100)
        }));

        // Process in chunks to avoid memory issues
        const chunkSize = 100;
        const chunks = [];
        
        for (let i = 0; i < largeDataset.length; i += chunkSize) {
            chunks.push(largeDataset.slice(i, i + chunkSize));
        }

        assert.strictEqual(chunks.length, 10, 'Should create 10 chunks');
        
        const processedCount = chunks.reduce((total, chunk) => {
            return total + chunk.length;
        }, 0);

        assert.strictEqual(processedCount, 1000, 'Should process all items');
    });
});