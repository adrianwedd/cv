
/**
 * Dynamic Feature Loader
 * 
 * Handles progressive enhancement and lazy loading of non-critical features.
 */

class DynamicLoader {
    constructor() {
        this.loadedChunks = new Set();
        this.loadingChunks = new Map();
    }

    async loadChunk(chunkName) {
        // Prevent duplicate loading
        if (this.loadedChunks.has(chunkName)) {
            return;
        }
        
        if (this.loadingChunks.has(chunkName)) {
            return this.loadingChunks.get(chunkName);
        }
        
        
        
        const loadPromise = this.importChunk(chunkName);
        this.loadingChunks.set(chunkName, loadPromise);
        
        try {
            const module = await loadPromise;
            this.loadedChunks.add(chunkName);
            this.loadingChunks.delete(chunkName);
            
            
            return module;
            
        } catch (error) {
            console.error(`❌ Failed to load chunk: ${chunkName}`, error);
            this.loadingChunks.delete(chunkName);
            throw error;
        }
    }

    async importChunk(chunkName) {
        // Use script injection instead of dynamic import for non-module compatibility
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `./assets/chunks/${chunkName}.min.js`;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load chunk: ${chunkName}`));
            document.head.appendChild(script);
        });
    }

    preloadChunk(chunkName) {
        // Preload chunk for faster subsequent loading
        const link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = `./assets/chunks/${chunkName}.min.js`;
        document.head.appendChild(link);
    }

    async loadChunksOnInteraction() {
        // Load chunks when user starts interacting
        const loadOnFirstInteraction = () => {
            this.loadChunk('performance-monitor');
            this.loadChunk('github-integration');
            
            // Remove listeners after first interaction
            document.removeEventListener('click', loadOnFirstInteraction);
            document.removeEventListener('scroll', loadOnFirstInteraction);
            document.removeEventListener('touchstart', loadOnFirstInteraction);
        };
        
        document.addEventListener('click', loadOnFirstInteraction, { once: true });
        document.addEventListener('scroll', loadOnFirstInteraction, { once: true });
        document.addEventListener('touchstart', loadOnFirstInteraction, { once: true });
    }
}

// Global loader instance
window.dynamicLoader = new DynamicLoader();

// Start interaction-based loading
window.dynamicLoader.loadChunksOnInteraction();
