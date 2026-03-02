/**
 * Skills section renderer.
 */
import { groupSkillsByCategory } from '../utils.js';
import { getDefaultSkills } from '../defaults.js';

/**
 * Initialize the skills container section.
 * @param {Object} cvData - The CV data object
 */
export function initializeSkillsSection(cvData) {
    const container = document.getElementById('skills-container');
    if (!container) return;

    const skills = cvData?.skills || getDefaultSkills();
    const skillCategories = groupSkillsByCategory(skills);

    container.textContent = '';
    for (const [category, categorySkills] of Object.entries(skillCategories)) {
        const catDiv = document.createElement('div');
        catDiv.className = 'skill-category';
        const catTitle = document.createElement('h3');
        catTitle.className = 'skill-category-title';
        catTitle.textContent = category;
        catDiv.appendChild(catTitle);

        const itemsDiv = document.createElement('div');
        itemsDiv.className = 'skill-items';
        itemsDiv.setAttribute('role', 'list');

        for (const skill of categorySkills) {
            const tier = skill.tier || 'Secondary';

            const skillItem = document.createElement('div');
            skillItem.className = 'skill-item';
            skillItem.setAttribute('role', 'listitem');

            const skillHeader = document.createElement('div');
            skillHeader.className = 'skill-header';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'skill-name';
            nameSpan.textContent = skill.name || '';
            const tierSpan = document.createElement('span');
            tierSpan.className = 'skill-level';
            tierSpan.textContent = tier;
            skillHeader.appendChild(nameSpan);
            skillHeader.appendChild(tierSpan);
            skillItem.appendChild(skillHeader);

            itemsDiv.appendChild(skillItem);
        }

        catDiv.appendChild(itemsDiv);
        container.appendChild(catDiv);
    }
}
