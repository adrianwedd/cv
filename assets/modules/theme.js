/**
 * Theme management: toggle, apply, and persist theme preference.
 */
import { CONFIG } from './config.js';

/**
 * Get the stored theme preference, defaulting to dark.
 */
export function getStoredTheme() {
    return localStorage.getItem(CONFIG.THEME_KEY) || 'dark';
}

/**
 * Store the theme preference.
 */
export function storeTheme(theme) {
    localStorage.setItem(CONFIG.THEME_KEY, theme);
}

/**
 * Apply the given theme to the document.
 */
export function applyTheme(theme) {
    if (theme === 'dark') {
        // Dark is the :root default, so remove data-theme
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

/**
 * Setup theme toggle button and return a function to get current theme.
 * Returns the initial theme preference string.
 */
export function setupThemeToggle() {
    let themePreference = getStoredTheme();
    applyTheme(themePreference);

    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle?.querySelector('.theme-icon');

    if (themeIcon) {
        themeIcon.textContent = themePreference === 'dark' ? '\u2600' : '\u263E';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            themePreference = themePreference === 'dark' ? 'light' : 'dark';
            applyTheme(themePreference);
            storeTheme(themePreference);

            const icon = document.querySelector('.theme-icon');
            if (icon) {
                icon.textContent = themePreference === 'dark' ? '\u2600' : '\u263E';
            }
        });
    }

    return themePreference;
}
