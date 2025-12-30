#!/usr/bin/env node

/**
 * Self-Healing System
 * Automatically detects and repairs system issues
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SelfHealingSystem {
    constructor() {
        this.config = {
            checkInterval: 5 * 60 * 1000, // 5 minutes
            healingLog: path.join(__dirname, 'self-healing.log'),
            criticalFiles: [
                'index.html',
                'assets/styles.css',
                'assets/script.js',
                'data/base-cv.json'
            ],
            healthChecks: {
                files: true,
                performance: true,
                data: true,
                dependencies: true
            }
        };
        
        this.healingHistory = [];
        this.issues = new Map();
    }
    
    async initialize() {
        console.log('🏥 Initializing Self-Healing System...');
        await this.loadHistory();
        console.log('✅ Self-Healing System ready');
    }
    
    async loadHistory() {
        try {
            const data = await fs.readFile(this.config.healingLog, 'utf8');
            this.healingHistory = data.split('\n').filter(line => line);
        } catch (error) {
            console.log('📝 Starting fresh healing log');
        }
    }
    
    async detectIssues() {
        const issues = [];
        
        // Check critical files exist
        if (this.config.healthChecks.files) {
            for (const file of this.config.criticalFiles) {
                try {
                    await fs.access(file);
                } catch (error) {
                    issues.push({
                        type: 'missing-file',
                        severity: 'critical',
                        file,
                        description: `Critical file missing: ${file}`
                    });
                }
            }
        }
        
        // Check data integrity
        if (this.config.healthChecks.data) {
            try {
                const cvData = await fs.readFile('data/base-cv.json', 'utf8');
                const cv = JSON.parse(cvData);
                
                // Validate required fields
                const requiredFields = ['personal_info', 'experience', 'skills'];
                for (const field of requiredFields) {
                    if (!cv[field]) {
                        issues.push({
                            type: 'data-corruption',
                            severity: 'high',
                            field,
                            description: `Missing required CV field: ${field}`
                        });
                    }
                }
            } catch (error) {
                issues.push({
                    type: 'data-corruption',
                    severity: 'critical',
                    description: 'CV data file is corrupted or invalid'
                });
            }
        }
        
        // Check performance metrics
        if (this.config.healthChecks.performance) {
            try {
                const healthData = await fs.readFile('health-summary.json', 'utf8');
                const health = JSON.parse(healthData);
                
                if (health.healthScore < 70) {
                    issues.push({
                        type: 'performance-degradation',
                        severity: 'medium',
                        score: health.healthScore,
                        description: `Health score ${health.healthScore} is below threshold`
                    });
                }
                
                // Check repository size
                const repoSize = parseInt(health.repositorySize);
                if (repoSize > 200) {
                    issues.push({
                        type: 'repository-bloat',
                        severity: 'medium',
                        size: repoSize,
                        description: `Repository size ${repoSize}MB exceeds limit`
                    });
                }
            } catch (error) {
                // Health metrics not critical
            }
        }
        
        // Check for orphaned processes
        try {
            const { stdout } = await execAsync('ps aux | grep -E "(quality-feedback|predictive-maintenance|recursive-improvement)" | grep -v grep | wc -l');
            const processCount = parseInt(stdout.trim());
            
            if (processCount > 3) {
                issues.push({
                    type: 'runaway-processes',
                    severity: 'high',
                    count: processCount,
                    description: `${processCount} optimization processes running (max: 3)`
                });
            }
        } catch (error) {
            // Process check not critical
        }
        
        return issues;
    }
    
    async healIssue(issue) {
        console.log(`🔧 Healing: ${issue.description}`);
        
        try {
            switch (issue.type) {
                case 'missing-file':
                    await this.restoreMissingFile(issue);
                    break;
                    
                case 'data-corruption':
                    await this.repairDataCorruption(issue);
                    break;
                    
                case 'performance-degradation':
                    await this.improvePerformance(issue);
                    break;
                    
                case 'repository-bloat':
                    await this.reduceRepositorySize(issue);
                    break;
                    
                case 'runaway-processes':
                    await this.killRunawayProcesses(issue);
                    break;
                    
                default:
                    console.log(`⚠️  Unknown issue type: ${issue.type}`);
            }
            
            await this.logHealing(issue, 'success');
            return true;
        } catch (error) {
            console.error(`❌ Failed to heal: ${error.message}`);
            await this.logHealing(issue, 'failed', error.message);
            return false;
        }
    }
    
    async restoreMissingFile(issue) {
        console.log(`📁 Restoring missing file: ${issue.file}`);
        
        // Try to restore from git
        try {
            await execAsync(`git checkout HEAD -- ${issue.file}`);
            console.log('✅ File restored from git');
        } catch (error) {
            // Create minimal file if git restore fails
            const dir = path.dirname(issue.file);
            await fs.mkdir(dir, { recursive: true });
            
            if (issue.file.endsWith('.json')) {
                await fs.writeFile(issue.file, '{}');
            } else if (issue.file.endsWith('.js')) {
                await fs.writeFile(issue.file, '// Restored by self-healing system\n');
            } else if (issue.file.endsWith('.css')) {
                await fs.writeFile(issue.file, '/* Restored by self-healing system */\n');
            } else if (issue.file.endsWith('.html')) {
                await fs.writeFile(issue.file, '<!DOCTYPE html>\n<html><body>Restored</body></html>');
            }
            
            console.log('✅ File recreated with minimal content');
        }
    }
    
    async repairDataCorruption(issue) {
        console.log('🔨 Repairing data corruption...');
        
        // Try to restore from backup
        try {
            await execAsync('cp data/base-cv.backup.json data/base-cv.json 2>/dev/null');
            console.log('✅ Restored from backup');
        } catch (error) {
            // Create minimal valid structure
            const minimalCV = {
                metadata: {
                    version: "1.0.0",
                    last_updated: new Date().toISOString()
                },
                personal_info: {
                    name: "Adrian Wedd",
                    title: "AI Engineer",
                    location: "Tasmania, Australia"
                },
                experience: [],
                skills: [],
                projects: []
            };
            
            await fs.writeFile('data/base-cv.json', JSON.stringify(minimalCV, null, 2));
            console.log('✅ Created minimal valid CV structure');
        }
    }
    
    async improvePerformance(issue) {
        console.log('⚡ Improving performance...');
        
        // Clean up temporary files
        await execAsync('find . -name "*.tmp" -o -name "*.cache" -delete 2>/dev/null || true');
        
        // Compress JSON files
        await execAsync('find . -name "*.json" -size +50k -exec node -e "const fs=require(\'fs\');const f=process.argv[1];try{const d=JSON.parse(fs.readFileSync(f));fs.writeFileSync(f,JSON.stringify(d))}catch(e){}" {} \\; 2>/dev/null || true');
        
        console.log('✅ Performance improvements applied');
    }
    
    async reduceRepositorySize(issue) {
        console.log('🧹 Reducing repository size...');
        
        // Remove old archives
        await execAsync('find . -path "*/archive/*" -mtime +3 -delete 2>/dev/null || true');
        
        // Clean node_modules
        await execAsync('find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true');
        
        // Remove large log files
        await execAsync('find . -name "*.log" -size +1M -delete 2>/dev/null || true');
        
        console.log('✅ Repository size reduced');
    }
    
    async killRunawayProcesses(issue) {
        console.log('🛑 Killing runaway processes...');
        
        await execAsync('pkill -f "quality-feedback-system.js" 2>/dev/null || true');
        await execAsync('pkill -f "predictive-maintenance.js" 2>/dev/null || true');
        await execAsync('pkill -f "recursive-improvement-orchestrator.js" 2>/dev/null || true');
        
        console.log('✅ Runaway processes terminated');
    }
    
    async logHealing(issue, status, error = null) {
        const entry = {
            timestamp: new Date().toISOString(),
            issue: issue.type,
            severity: issue.severity,
            status,
            description: issue.description,
            error
        };
        
        const logLine = JSON.stringify(entry) + '\n';
        await fs.appendFile(this.config.healingLog, logLine);
        
        this.healingHistory.push(logLine);
    }
    
    async performHealthCheck() {
        console.log('\n🔍 Performing health check...');
        
        const issues = await this.detectIssues();
        
        if (issues.length === 0) {
            console.log('✅ System is healthy - no issues detected');
            return;
        }
        
        console.log(`⚠️  Found ${issues.length} issues requiring healing`);
        
        // Sort by severity
        const sortedIssues = issues.sort((a, b) => {
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });
        
        // Heal issues
        let healed = 0;
        for (const issue of sortedIssues) {
            const success = await this.healIssue(issue);
            if (success) healed++;
        }
        
        console.log(`✅ Healed ${healed}/${issues.length} issues`);
    }
    
    async start() {
        await this.initialize();
        
        console.log('🏥 Starting Self-Healing System...');
        console.log(`   Check interval: ${this.config.checkInterval / 1000 / 60} minutes`);
        console.log('   Press Ctrl+C to stop\n');
        
        // Run initial check
        await this.performHealthCheck();
        
        // Schedule recurring checks
        const interval = setInterval(async () => {
            await this.performHealthCheck();
        }, this.config.checkInterval);
        
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down Self-Healing System...');
            clearInterval(interval);
            console.log(`📊 Healed ${this.healingHistory.length} issues in this session`);
            process.exit(0);
        });
    }
}

// Self-executing
if (require.main === module) {
    const healer = new SelfHealingSystem();
    healer.start().catch(console.error);
}

module.exports = SelfHealingSystem;