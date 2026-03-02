/**
 * Experience section renderer.
 */
import { getDefaultExperience } from '../defaults.js';

/**
 * Initialize the experience timeline section.
 * @param {Object} cvData - The CV data object
 */
export function initializeExperienceSection(cvData) {
    const timeline = document.getElementById('experience-timeline');
    if (!timeline) return;

    const experiences = cvData?.experience || getDefaultExperience();

    timeline.textContent = '';
    for (const exp of experiences) {
        const item = document.createElement('div');
        item.className = 'timeline-item';

        const content = document.createElement('div');
        content.className = 'timeline-content';

        const header = document.createElement('div');
        header.className = 'timeline-header';
        const title = document.createElement('h3');
        title.className = 'position-title';
        title.textContent = exp.position || '';
        header.appendChild(title);

        const companyInfo = document.createElement('div');
        companyInfo.className = 'company-info';
        const companyName = document.createElement('span');
        companyName.className = 'company-name';
        companyName.textContent = exp.company || '';
        const period = document.createElement('span');
        period.className = 'timeline-period';
        period.textContent = exp.period || '';
        companyInfo.appendChild(companyName);
        companyInfo.appendChild(period);
        header.appendChild(companyInfo);
        content.appendChild(header);

        const desc = document.createElement('div');
        desc.className = 'timeline-description';
        const descP = document.createElement('p');
        descP.textContent = exp.description || '';
        desc.appendChild(descP);

        if (exp.achievements) {
            const ul = document.createElement('ul');
            ul.className = 'achievement-list';
            for (const achievement of exp.achievements) {
                const li = document.createElement('li');
                li.textContent = achievement;
                ul.appendChild(li);
            }
            desc.appendChild(ul);
        }
        content.appendChild(desc);

        if (exp.technologies) {
            const tags = document.createElement('div');
            tags.className = 'tech-tags';
            for (const tech of exp.technologies) {
                const tag = document.createElement('span');
                tag.className = 'tech-tag';
                tag.textContent = tech;
                tags.appendChild(tag);
            }
            content.appendChild(tags);
        }

        item.appendChild(content);
        timeline.appendChild(item);
    }
}
