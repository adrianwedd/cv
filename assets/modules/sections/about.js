/**
 * About / Professional Summary section renderer.
 *
 * Renders only curated content from base-cv.json. AI proposals live in
 * data/ai-enhancements.json and reach the page exclusively via the verified
 * apply step that writes them into base-cv.json — never directly.
 */

/**
 * Initialize the about section with the professional summary.
 * @param {Object} cvData - The CV data object
 */
export function initializeAboutSection(cvData) {
    const summaryElement = document.getElementById('professional-summary');
    if (!summaryElement) return;

    const summary = cvData?.professional_summary || summaryElement.textContent;
    summaryElement.textContent = summary;
}
