/**
 * Chunk Loader - Dynamic script loading for lazy features
 * Replaces ES6 dynamic imports with script injection
 */

(function(window) {
    'use strict';
    
    window.ChunkLoader = {
        loadedChunks: new Set(),
        
        loadChunk: function(chunkName) {
            return new Promise((resolve, reject) => {
                // Check if already loaded
                if (this.loadedChunks.has(chunkName)) {
                    resolve();
                    return;
                }
                
                // Create script element
                const script = document.createElement('script');
                script.src = `assets/chunks/${chunkName}.js`;
                script.async = true;
                
                script.onload = () => {
                    this.loadedChunks.add(chunkName);
                    console.log(`✅ Loaded chunk: ${chunkName}`);
                    resolve();
                };
                
                script.onerror = () => {
                    console.warn(`❌ Failed to load chunk: ${chunkName}`);
                    reject(new Error(`Failed to load ${chunkName}`));
                };
                
                document.head.appendChild(script);
            });
        },
        
        loadLazyFeatures: async function() {
            try {
                // Load performance monitoring
                await this.loadChunk('performance-monitor');
                if (window.PerformanceMonitor) {
                    window.cvApp.performanceMonitor = new window.PerformanceMonitor();
                }
                
                // Load GitHub integration
                await this.loadChunk('github-integration');
                if (window.GitHubIntegration) {
                    window.cvApp.githubIntegration = new window.GitHubIntegration();
                }
                
                // Load data visualizations
                await this.loadChunk('data-visualizer');
                if (window.DataVisualizer) {
                    window.cvApp.dataVisualizer = new window.DataVisualizer();
                }
                
                console.log('✅ All lazy features loaded');
            } catch (error) {
                console.warn('Failed to load some lazy features:', error);
            }
        }
    };
    
})(window);