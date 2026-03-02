/**
 * Projects section renderer.
 */
import { sanitizeURL } from '../utils.js';
import { getDefaultProjects } from '../defaults.js';

/**
 * Initialize the projects grid section.
 * @param {Object} cvData - The CV data object
 */
export function initializeProjectsSection(cvData) {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    const projects = cvData?.projects || getDefaultProjects();

    grid.textContent = '';
    for (const project of projects) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.setAttribute('role', 'article');

        const headerDiv = document.createElement('div');
        headerDiv.className = 'project-header';
        const titleEl = document.createElement('h3');
        titleEl.className = 'project-title';
        titleEl.textContent = project.name || '';
        headerDiv.appendChild(titleEl);

        const linksDiv = document.createElement('div');
        linksDiv.className = 'project-links';
        if (project.github && sanitizeURL(project.github)) {
            const ghLink = document.createElement('a');
            ghLink.href = sanitizeURL(project.github);
            ghLink.target = '_blank';
            ghLink.rel = 'noopener noreferrer';
            ghLink.className = 'project-link';
            ghLink.textContent = 'GitHub';
            linksDiv.appendChild(ghLink);
        }
        if (project.url && sanitizeURL(project.url)) {
            const urlLink = document.createElement('a');
            urlLink.href = sanitizeURL(project.url);
            urlLink.target = '_blank';
            urlLink.rel = 'noopener noreferrer';
            urlLink.className = 'project-link';
            urlLink.textContent = 'Website';
            linksDiv.appendChild(urlLink);
        }
        if (project.demo && sanitizeURL(project.demo)) {
            const demoLink = document.createElement('a');
            demoLink.href = sanitizeURL(project.demo);
            demoLink.target = '_blank';
            demoLink.rel = 'noopener noreferrer';
            demoLink.className = 'project-link';
            demoLink.textContent = 'Demo';
            linksDiv.appendChild(demoLink);
        }
        headerDiv.appendChild(linksDiv);
        card.appendChild(headerDiv);

        const descDiv = document.createElement('div');
        descDiv.className = 'project-description';
        const descP = document.createElement('p');
        descP.textContent = project.description || '';
        descDiv.appendChild(descP);
        card.appendChild(descDiv);

        if (project.technologies) {
            const techDiv = document.createElement('div');
            techDiv.className = 'project-tech';
            for (const tech of project.technologies) {
                const badge = document.createElement('span');
                badge.className = 'tech-badge';
                badge.textContent = tech;
                techDiv.appendChild(badge);
            }
            card.appendChild(techDiv);
        }

        if (project.metrics) {
            const metricsDiv = document.createElement('div');
            metricsDiv.className = 'project-metrics';
            for (const metric of project.metrics) {
                const metricItem = document.createElement('div');
                metricItem.className = 'metric-item';
                const val = document.createElement('span');
                val.className = 'metric-value';
                val.textContent = metric.value || '';
                const label = document.createElement('span');
                label.className = 'metric-label';
                label.textContent = metric.label || '';
                metricItem.appendChild(val);
                metricItem.appendChild(label);
                metricsDiv.appendChild(metricItem);
            }
            card.appendChild(metricsDiv);
        }

        grid.appendChild(card);
    }
}
