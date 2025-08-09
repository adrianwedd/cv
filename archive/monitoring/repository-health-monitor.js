#!/usr/bin/env node
// Repository Health Monitor
import { RepositorySurgeon } from './repository-surgeon.js';

class HealthMonitor {
    async run() {
        const surgeon = new RepositorySurgeon();
        const metrics = await surgeon.getRepositoryMetrics();
        
        console.log('📊 Repository Health Check:', metrics);
        
        if (metrics.technicalDebtScore > 50) {
            console.warn('⚠️ High technical debt detected!');
        }
        
        return metrics;
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    new HealthMonitor().run().catch(console.error);
}
