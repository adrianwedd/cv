/**
 * Achievements section renderer.
 */
import { sanitizeURL } from '../utils.js';
import { getDefaultAchievements } from '../defaults.js';

/**
 * Initialize the achievements grid section.
 * @param {Object} cvData - The CV data object
 */
export function initializeAchievementsSection(cvData) {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;

    const achievements = cvData?.achievements || getDefaultAchievements();

    grid.textContent = '';
    for (const achievement of achievements) {
        const card = document.createElement('div');
        card.className = 'achievement-card';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'achievement-content';

        // icon field exists in data but is intentionally not rendered (was not rendered in original script.js either)

        const titleEl = document.createElement('h3');
        titleEl.className = 'achievement-title';
        titleEl.textContent = achievement.title || '';
        contentDiv.appendChild(titleEl);

        const descEl = document.createElement('p');
        descEl.className = 'achievement-description';
        descEl.textContent = achievement.description || '';
        contentDiv.appendChild(descEl);

        if (achievement.date) {
            const dateDiv = document.createElement('div');
            dateDiv.className = 'achievement-date';
            dateDiv.textContent = achievement.date;
            contentDiv.appendChild(dateDiv);
        }

        if (achievement.link && sanitizeURL(achievement.link)) {
            const link = document.createElement('a');
            link.href = sanitizeURL(achievement.link);
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'achievement-link';
            link.textContent = 'View Details';
            contentDiv.appendChild(link);
        }

        card.appendChild(contentDiv);
        grid.appendChild(card);
    }
}
