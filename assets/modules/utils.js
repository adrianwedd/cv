/**
 * Utility functions for CV application.
 */

/**
 * Validate a URL string. Returns the URL or empty string.
 * Only allows http, https, and mailto protocols.
 */
export function sanitizeURL(url) {
    if (!url) return '';
    const str = String(url).trim();
    if (/^mailto:/i.test(str)) {
        return str;
    }
    try {
        const parsed = new URL(str);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch {
        // invalid URL
    }
    return '';
}

/**
 * Format a date/time string for display.
 */
export function formatDateTime(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Group an array of skills by their category property.
 */
export function groupSkillsByCategory(skills) {
    return skills.reduce((categories, skill) => {
        const category = skill.category || 'Other';
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(skill);
        return categories;
    }, {});
}
