/**
 * Interests section renderer.
 */

/**
 * Initialize the interests container section.
 * @param {Object} cvData - The CV data object
 */
export function initializeInterestsSection(cvData) {
    const container = document.getElementById('interests-container');
    if (!container) return;

    const interests = cvData?.interests || [];
    if (!interests.length) return;

    container.textContent = '';
    const list = document.createElement('ul');
    list.className = 'interests-list';

    for (const interest of interests) {
        const li = document.createElement('li');
        li.className = 'interest-item';
        li.textContent = interest;
        list.appendChild(li);
    }

    container.appendChild(list);
}
