/**
 * Data loading functions for CV application.
 */
import { CONFIG } from './config.js';
import { getDefaultCVData } from './defaults.js';

/**
 * Load CV data from JSON file or injected window global.
 */
export async function loadCVData() {
    if (window.__CV_DATA__) return window.__CV_DATA__;
    try {
        const response = await fetch(CONFIG.DATA_ENDPOINTS.BASE_CV);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.warn('CV data not available, using defaults');
        return getDefaultCVData();
    }
}

/**
 * Load GitHub activity data.
 */
export async function loadActivityData() {
    if (window.__ACTIVITY_DATA__) return window.__ACTIVITY_DATA__;
    try {
        const response = await fetch(CONFIG.DATA_ENDPOINTS.ACTIVITY_SUMMARY);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.warn('Activity data not available');
        return {};
    }
}
