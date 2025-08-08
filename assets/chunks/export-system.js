
/**
 * Export System - Lazy Loaded Chunk
 * PDF generation and data export functionality
 */

export class ExportSystem {
    constructor() {
        this.init();
    }

    async init() {
        
        
        this.setupExportButtons();
    }

    setupExportButtons() {
        const exportButtons = document.querySelectorAll('.export-btn');
        exportButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = btn.dataset.format || 'pdf';
                this.exportCV(format);
            });
        });
    }

    async exportCV(format = 'pdf') {
        
        
        switch (format) {
            case 'pdf':
                await this.exportToPDF();
                break;
            case 'json':
                await this.exportToJSON();
                break;
            default:
                console.warn('Unsupported export format:', format);
        }
    }

    async exportToPDF() {
        // Simple PDF export (would integrate with PDF library)
        const link = document.createElement('a');
        link.href = 'assets/adrian-wedd-cv.pdf';
        link.download = 'adrian-wedd-cv.pdf';
        link.click();
    }

    async exportToJSON() {
        // Export CV data as JSON
        const cvData = window.cvApp?.cache.get('cv-data');
        if (cvData) {
            const dataStr = JSON.stringify(cvData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'cv-data.json';
            link.click();
            
            URL.revokeObjectURL(url);
        }
    }
}