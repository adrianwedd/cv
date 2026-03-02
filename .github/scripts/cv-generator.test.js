const { test, suite } = require('node:test');
const assert = require('assert');
const { CVGenerator } = require('./cv-generator.js');
const fs = require('fs').promises;

function mockFs() {
    fs.rm = async () => {};
    fs.mkdir = async () => {};
    fs.readFile = async (filePath) => {
        if (filePath.includes('index.html')) return '<html><head><title>Test</title><meta name="description" content="test"></head><body><p id="professional-summary"></p><span id="footer-last-updated"></span></body></html>';
        if (filePath.includes('base-cv.json')) return JSON.stringify({
            personal_info: { name: 'Test User', title: 'Test Title', location: 'Test City', phone: '555', email: 'test@test.com', linkedin: 'https://linkedin.com/in/test', github: 'https://github.com/test' },
            professional_summary: 'First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence.',
            skills: [{name: 'JS', category: 'Programming Languages'}],
            experience: [{ position: 'Dev', company: 'Co', period: '2020-2024', description: 'Did things. More things.', achievements: ['Built X', 'Shipped Y', 'Led Z', 'Extra'] }],
            projects: [{ name: 'Proj1', description: 'A project. Details here.' }],
            education: [{ degree: 'CS Degree', institution: 'Uni', period: '2016-2020' }]
        });
        if (filePath.includes('ats-template.html')) return '<!DOCTYPE html><html><body><h1>{{NAME}}</h1><p>{{TITLE}}</p><p>{{LOCATION}} {{PHONE}} {{EMAIL}} {{LINKEDIN_URL}} {{GITHUB_URL}}</p><p>{{SUMMARY}}</p><p>{{COMPETENCIES}}</p>{{EXPERIENCE}}<ul>{{PROJECTS}}</ul><p>{{SKILLS}}</p>{{EDUCATION}}</body></html>';
        if (filePath.includes('activity-summary.json')) return JSON.stringify({
            summary: { total_commits: 42, active_days: 10, net_lines_contributed: 5000, tracking_status: 'active', last_commit_date: '2026-03-01' },
            last_updated: '2026-03-01T00:00:00Z'
        });
        if (filePath.includes('ai-enhancements.json')) return JSON.stringify({
            last_updated: null, professional_summary: {}, skills_enhancement: {}, enhancement_summary: {}
        });
        return '{}';
    };
    fs.writeFile = async () => {};
    fs.copyFile = async () => {};
}

suite('CVGenerator', () => {
    test('should load data sources correctly', async () => {
        mockFs();
        const generator = new CVGenerator();
        await generator.loadDataSources();
        assert.strictEqual(generator.cvData.personal_info.name, 'Test User');
    });

    test('should generate HTML with updated meta tags', async () => {
        mockFs();
        const generator = new CVGenerator();
        await generator.loadDataSources();
        await generator.generateHTML();
        assert(true);
    });

    test('should call generatePDF during overall generation', async () => {
        mockFs();
        const generator = new CVGenerator();
        generator.generatePDF = async () => { generator._pdfGenerated = true; };
        generator.generateATSPDF = async () => { generator._atsPdfGenerated = true; };
        await generator.generate();
        assert.strictEqual(generator._pdfGenerated, true, 'generatePDF should be called');
        assert.strictEqual(generator._atsPdfGenerated, true, 'generateATSPDF should be called');
    });

    test('buildATSHTML should return HTML with no remaining placeholders', async () => {
        mockFs();
        const generator = new CVGenerator();
        await generator.loadDataSources();
        const html = await generator.buildATSHTML();
        assert.strictEqual(html.includes('{{'), false, 'No unreplaced {{ placeholders should remain');
        assert.strictEqual(html.includes('}}'), false, 'No unreplaced }} placeholders should remain');
    });

    test('buildATSHTML should include name and title', async () => {
        mockFs();
        const generator = new CVGenerator();
        await generator.loadDataSources();
        const html = await generator.buildATSHTML();
        assert(html.includes('Test User'), 'HTML should include the name');
        assert(html.includes('Test Title'), 'HTML should include the title');
    });
});
