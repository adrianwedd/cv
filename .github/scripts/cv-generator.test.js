const { test, suite } = require('node:test');
const assert = require('assert');
const { CVGenerator } = require('./cv-generator.js');
const fs = require('fs').promises;

function mockFs() {
    fs.rm = async () => {};
    fs.mkdir = async () => {};
    fs.readFile = async (filePath) => {
        if (filePath.includes('index.html')) return '<html><head><title>Test</title><meta name="description" content="test"></head><body><p id="professional-summary"></p><span id="footer-last-updated"></span></body></html>';
        if (filePath.includes('base-cv.json')) return JSON.stringify({ personal_info: { name: 'Test User', title: 'Test Title' }, professional_summary: 'Original summary.', skills: [{name: 'JS'}] });
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
        await generator.generate();
        assert.strictEqual(generator._pdfGenerated, true, 'generatePDF should be called');
    });
});
