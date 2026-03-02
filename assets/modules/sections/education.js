/**
 * Education section renderer.
 */

/**
 * Initialize the education container section.
 * @param {Object} cvData - The CV data object
 */
export function initializeEducationSection(cvData) {
    const container = document.getElementById('education-container');
    if (!container) return;

    const education = cvData?.education || [];
    if (!education.length) return;

    container.textContent = '';
    for (const edu of education) {
        const item = document.createElement('div');
        item.className = 'education-item';

        const header = document.createElement('div');
        header.className = 'education-header';

        const degree = document.createElement('h3');
        degree.className = 'education-degree';
        degree.textContent = edu.degree || '';
        header.appendChild(degree);

        if (edu.period) {
            const period = document.createElement('span');
            period.className = 'education-period';
            period.textContent = edu.period;
            header.appendChild(period);
        }

        item.appendChild(header);

        if (edu.institution) {
            const inst = document.createElement('div');
            inst.className = 'education-institution';
            inst.textContent = edu.institution;
            item.appendChild(inst);
        }

        if (edu.description) {
            const desc = document.createElement('p');
            desc.className = 'education-description';
            desc.textContent = edu.description;
            item.appendChild(desc);
        }

        // key_areas field exists in data but is intentionally not rendered (was not rendered in original script.js either)

        container.appendChild(item);
    }
}
