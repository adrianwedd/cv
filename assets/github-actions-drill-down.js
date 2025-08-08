/**
 * GitHub Actions Drill-Down Extension
 * 
 * Provides detailed job-level analysis and debugging capabilities
 * for GitHub Actions workflow runs.
 * 
 * Features:
 * - Job-level execution details and timing
 * - Step-by-step execution breakdown
 * - Error analysis and debugging recommendations
 * - Performance bottleneck identification
 * - Resource usage analytics per job
 * - Historical comparison and trend analysis
 */

class GitHubActionsDrillDown {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.config = visualizer.config;
        this.jobCache = new Map();
        this.currentRunId = null;
        
        this.init();
    }
    
    /**
     * Initialize drill-down functionality
     */
    init() {
        
        this.enhanceTimelineWithDrillDown();
    }
    
    /**
     * Enhance timeline with drill-down capabilities
     */
    enhanceTimelineWithDrillDown() {
        // Override the timeline click handler
        const originalShowRunDetails = this.visualizer.showRunDetails.bind(this.visualizer);
        
        this.visualizer.showRunDetails = async (runId) => {
            this.currentRunId = runId;
            await this.showDetailedRunAnalysis(runId);
        };
        
        
    }
    
    /**
     * Show detailed run analysis
     */
    async showDetailedRunAnalysis(runId) {
        try {
            // Highlight selected run
            this.highlightSelectedRun(runId);
            
            // Load job details
            const jobDetails = await this.loadJobDetails(runId);
            
            // Show job details section
            this.renderJobDetailsSection(jobDetails);
            
        } catch (error) {
            console.error('Failed to load run details:', error);
            this.showDrillDownError(error.message);
        }
    }
    
    /**
     * Highlight selected run in timeline
     */
    highlightSelectedRun(runId) {
        // Clear previous selections
        document.querySelectorAll('.timeline-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Highlight selected run
        const selectedItem = document.querySelector(`[data-run-id="${runId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
            selectedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    /**
     * Load job details from GitHub API
     */
    async loadJobDetails(runId) {
        // Check cache first
        if (this.jobCache.has(runId)) {
            return this.jobCache.get(runId);
        }
        
        try {
            // Fetch jobs for this run
            const jobsResponse = await fetch(
                `${this.config.apiBase}/repos/${this.config.owner}/${this.config.repo}/actions/runs/${runId}/jobs`
            );
            
            if (!jobsResponse.ok) {
                throw new Error(`GitHub API error: ${jobsResponse.status}`);
            }
            
            const jobsData = await jobsResponse.json();
            
            // Fetch run details
            const runResponse = await fetch(
                `${this.config.apiBase}/repos/${this.config.owner}/${this.config.repo}/actions/runs/${runId}`
            );
            
            const runData = runResponse.ok ? await runResponse.json() : null;
            
            const result = {
                run: runData,
                jobs: jobsData.jobs || [],
                totalJobs: jobsData.total_count || 0
            };
            
            // Cache the result
            this.jobCache.set(runId, result);
            
            return result;
            
        } catch (error) {
            console.error('Failed to load job details:', error);
            throw error;
        }
    }
    
    /**
     * Render job details section
     */
    renderJobDetailsSection(jobDetails) {
        const jobDetailsSection = document.getElementById('job-details-section');
        const jobDetailsContainer = document.getElementById('job-details');
        
        if (!jobDetailsSection || !jobDetailsContainer) return;
        
        // Show the section
        jobDetailsSection.style.display = 'block';
        
        // Calculate job metrics
        const jobMetrics = this.calculateJobMetrics(jobDetails);
        
        // Render content
        jobDetailsContainer.innerHTML = `
            <div class="job-overview">
                <div class="job-overview-header">
                    <h4>🔍 Workflow Run Analysis</h4>
                    <div class="run-meta">
                        <span class="run-id">Run #${this.currentRunId}</span>
                        <span class="run-workflow">${jobDetails.run?.name || 'Unknown Workflow'}</span>
                        <span class="run-trigger">${jobDetails.run?.event || 'unknown'}</span>
                    </div>
                </div>
                
                <div class="job-metrics-summary">
                    <div class="metric-card compact">
                        <div class="metric-icon">⚡</div>
                        <div class="metric-content">
                            <div class="metric-value">${jobMetrics.totalDuration}</div>
                            <div class="metric-label">Total Duration</div>
                        </div>
                    </div>
                    <div class="metric-card compact">
                        <div class="metric-icon">${jobMetrics.overallStatus === 'success' ? '✅' : jobMetrics.overallStatus === 'failure' ? '❌' : '⏳'}</div>
                        <div class="metric-content">
                            <div class="metric-value">${jobMetrics.successfulJobs}/${jobMetrics.totalJobs}</div>
                            <div class="metric-label">Jobs Passed</div>
                        </div>
                    </div>
                    <div class="metric-card compact">
                        <div class="metric-icon">🛠️</div>
                        <div class="metric-content">
                            <div class="metric-value">${jobMetrics.totalSteps}</div>
                            <div class="metric-label">Total Steps</div>
                        </div>
                    </div>
                    <div class="metric-card compact">
                        <div class="metric-icon">💰</div>
                        <div class="metric-content">
                            <div class="metric-value">$${jobMetrics.estimatedCost}</div>
                            <div class="metric-label">Est. Cost</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="jobs-timeline">
                <h4>📋 Job Execution Timeline</h4>
                <div class="jobs-list">
                    ${this.renderJobsList(jobDetails.jobs)}
                </div>
            </div>
            
            ${jobMetrics.failedJobs.length > 0 ? `
                <div class="failure-analysis">
                    <h4>🚨 Failure Analysis</h4>
                    <div class="failed-jobs">
                        ${this.renderFailureAnalysis(jobMetrics.failedJobs)}
                    </div>
                </div>
            ` : ''}
            
            <div class="performance-insights">
                <h4>📈 Performance Insights</h4>
                <div class="insights-grid">
                    ${this.renderPerformanceInsights(jobMetrics)}
                </div>
            </div>
        `;
        
        // Add event listeners for job expansion
        this.setupJobExpansion();
        
        // Scroll to job details
        jobDetailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    /**
     * Calculate job metrics
     */
    calculateJobMetrics(jobDetails) {
        const jobs = jobDetails.jobs || [];
        const totalJobs = jobs.length;
        const successfulJobs = jobs.filter(job => job.conclusion === 'success').length;
        const failedJobs = jobs.filter(job => job.conclusion === 'failure');
        
        // Calculate total duration
        const totalDurationMs = jobs.reduce((sum, job) => {
            if (job.started_at && job.completed_at) {
                return sum + (new Date(job.completed_at) - new Date(job.started_at));
            }
            return sum;
        }, 0);
        
        // Calculate total steps
        const totalSteps = jobs.reduce((sum, job) => sum + (job.steps?.length || 0), 0);
        
        // Estimate cost (GitHub Actions pricing: ~$0.008 per minute)
        const estimatedCost = Math.round((totalDurationMs / 60000) * 0.008 * 100) / 100;
        
        // Determine overall status
        let overallStatus = 'success';
        if (failedJobs.length > 0) {
            overallStatus = 'failure';
        } else if (jobs.some(job => job.status === 'in_progress')) {
            overallStatus = 'in_progress';
        }
        
        return {
            totalJobs,
            successfulJobs,
            failedJobs,
            totalDuration: this.formatDuration(totalDurationMs),
            totalSteps,
            estimatedCost,
            overallStatus
        };
    }
    
    /**
     * Render jobs list
     */
    renderJobsList(jobs) {
        return jobs.map(job => {
            const duration = job.started_at && job.completed_at ? 
                new Date(job.completed_at) - new Date(job.started_at) : 0;
            const status = job.conclusion || job.status || 'unknown';
            const stepCount = job.steps?.length || 0;
            
            return `
                <div class="job-item ${status}" data-job-id="${job.id}">
                    <div class="job-header">
                        <div class="job-status">
                            <span class="status-icon">${this.getJobStatusIcon(status)}</span>
                            <span class="job-name">${job.name}</span>
                        </div>
                        <div class="job-meta">
                            <span class="job-duration">${this.formatDuration(duration)}</span>
                            <span class="job-steps">${stepCount} steps</span>
                            <button class="job-expand" title="View Steps">
                                <span class="expand-icon">▼</span>
                            </button>
                        </div>
                    </div>
                    <div class="job-steps" style="display: none;">
                        ${this.renderJobSteps(job.steps || [])}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Render job steps
     */
    renderJobSteps(steps) {
        if (steps.length === 0) {
            return '<div class="no-steps">No step details available</div>';
        }
        
        return steps.map(step => {
            const duration = step.started_at && step.completed_at ? 
                new Date(step.completed_at) - new Date(step.started_at) : 0;
            const status = step.conclusion || 'unknown';
            
            return `
                <div class="step-item ${status}">
                    <div class="step-header">
                        <span class="step-status">${this.getStepStatusIcon(status)}</span>
                        <span class="step-name">${step.name}</span>
                        <span class="step-duration">${this.formatDuration(duration)}</span>
                    </div>
                    ${step.conclusion === 'failure' && step.conclusion ? `
                        <div class="step-logs">
                            <pre class="error-log">Step failed - check GitHub Actions logs for details</pre>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }
    
    /**
     * Render failure analysis
     */
    renderFailureAnalysis(failedJobs) {
        return failedJobs.map(job => {
            const failedSteps = (job.steps || []).filter(step => step.conclusion === 'failure');
            
            return `
                <div class="failed-job">
                    <div class="failed-job-header">
                        <span class="failure-icon">❌</span>
                        <span class="failed-job-name">${job.name}</span>
                    </div>
                    <div class="failure-details">
                        <div class="failure-summary">
                            Failed at step: ${failedSteps[0]?.name || 'Unknown step'}
                        </div>
                        <div class="failure-recommendations">
                            <strong>Recommendations:</strong>
                            <ul>
                                <li>Check the job logs in GitHub Actions for detailed error messages</li>
                                <li>Verify all required secrets and environment variables are set</li>
                                <li>Review recent changes that might have caused the failure</li>
                                ${failedSteps.length > 1 ? '<li>Multiple steps failed - investigate dependency issues</li>' : ''}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Render performance insights
     */
    renderPerformanceInsights(metrics) {
        const insights = [
            {
                icon: '⚡',
                title: 'Execution Efficiency',
                value: metrics.successfulJobs === metrics.totalJobs ? 'Excellent' : 'Needs Improvement',
                detail: `${metrics.successfulJobs}/${metrics.totalJobs} jobs completed successfully`
            },
            {
                icon: '💰',
                title: 'Cost Optimization',
                value: metrics.estimatedCost < 0.50 ? 'Optimized' : 'Review Required',
                detail: `$${metrics.estimatedCost} estimated cost for this run`
            },
            {
                icon: '🔄',
                title: 'Parallelization',
                value: metrics.totalJobs > 1 ? 'Good' : 'Consider Parallel Jobs',
                detail: `${metrics.totalJobs} jobs executed ${metrics.totalJobs > 1 ? 'in parallel' : 'sequentially'}`
            },
            {
                icon: '📊',
                title: 'Step Efficiency',
                value: metrics.totalSteps < 50 ? 'Efficient' : 'Consider Optimization',
                detail: `${metrics.totalSteps} total steps across all jobs`
            }
        ];
        
        return insights.map(insight => `
            <div class="insight-card">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <div class="insight-title">${insight.title}</div>
                    <div class="insight-value">${insight.value}</div>
                    <div class="insight-detail">${insight.detail}</div>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Setup job expansion functionality
     */
    setupJobExpansion() {
        document.querySelectorAll('.job-expand').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const jobItem = button.closest('.job-item');
                const jobSteps = jobItem.querySelector('.job-steps');
                const expandIcon = button.querySelector('.expand-icon');
                
                if (jobSteps.style.display === 'none') {
                    jobSteps.style.display = 'block';
                    expandIcon.textContent = '▲';
                } else {
                    jobSteps.style.display = 'none';
                    expandIcon.textContent = '▼';
                }
            });
        });
    }
    
    /**
     * Get job status icon
     */
    getJobStatusIcon(status) {
        const icons = {
            success: '✅',
            failure: '❌',
            cancelled: '⚠️',
            in_progress: '🔄',
            queued: '⏳',
            skipped: '⏭️'
        };
        return icons[status] || '❓';
    }
    
    /**
     * Get step status icon
     */
    getStepStatusIcon(status) {
        const icons = {
            success: '✅',
            failure: '❌',
            cancelled: '⚠️',
            skipped: '⏭️'
        };
        return icons[status] || '⏳';
    }
    
    /**
     * Format duration
     */
    formatDuration(milliseconds) {
        if (!milliseconds || milliseconds <= 0) return '—';
        
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    /**
     * Show drill-down error
     */
    showDrillDownError(message) {
        const jobDetailsContainer = document.getElementById('job-details');
        if (jobDetailsContainer) {
            jobDetailsContainer.innerHTML = `
                <div class="drill-down-error">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">Failed to load job details: ${message}</div>
                    <button class="error-retry" onclick="window.location.reload()">Retry</button>
                </div>
            `;
        }
    }
}

// Export for use with GitHubActionsVisualizer
window.GitHubActionsDrillDown = GitHubActionsDrillDown;