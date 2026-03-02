/**
 * About / Professional Summary section renderer.
 */

/**
 * Initialize the about section with professional summary.
 * @param {Object} cvData - The CV data object
 * @param {Object} aiEnhancements - AI enhancement data
 */
export function initializeAboutSection(cvData, aiEnhancements) {
    const summaryElement = document.getElementById('professional-summary');
    if (!summaryElement) return;

    let enhancedSummary = aiEnhancements?.professional_summary?.enhanced ||
                         cvData?.professional_summary ||
                         summaryElement.textContent;

    // Clean up AI-generated content that contains explanation text
    if (enhancedSummary && enhancedSummary.includes('**Enhanced Summary:**')) {
        const summaryMatch = enhancedSummary.match(/\*\*Enhanced Summary:\*\*\s*([\s\S]*?)(?:\n\nThis enhancement:|$)/);
        if (summaryMatch) {
            enhancedSummary = summaryMatch[1].trim();
        }
    }

    summaryElement.textContent = enhancedSummary;
}
