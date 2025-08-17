
/**
 * Enhanced CSS Lazy Loader - Progressive Enhancement
 * Loads CSS in priority order for optimal performance
 */

class CSSLazyLoader {
    constructor() {
        this.loadQueue = [
            { href: 'assets/styles.min.css', priority: 1 },
            { href: 'assets/styles-beautiful.min.css', priority: 2 },
            { href: 'assets/header-fixes.css', priority: 3 },
            { href: 'assets/critical-fixes.css', priority: 4 }
        ];
        
        this.loadedCount = 0;
        this.totalCount = this.loadQueue.length;
        
        this.init();
    }

    init() {
        // Load immediately if page is already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.startProgressiveLoading();
            });
        } else {
            this.startProgressiveLoading();
        }
    }

    startProgressiveLoading() {
        
        
        // Sort by priority
        this.loadQueue.sort((a, b) => a.priority - b.priority);
        
        // Load CSS files progressively
        this.loadNext();
    }

    loadNext() {
        if (this.loadedCount >= this.totalCount) {
            this.onAllLoaded();
            return;
        }
        
        const css = this.loadQueue[this.loadedCount];
        this.loadCSS(css.href).then(() => {
            this.loadedCount++;
            console.log(`✅ CSS loaded: ${css.href}`);
            
            // Load next with small delay for smooth progression
            setTimeout(() => this.loadNext(), 50);
        }).catch(error => {
            console.warn(`Failed to load CSS: ${css.href}`, error);
            this.loadedCount++;
            this.loadNext();
        });
    }

    loadCSS(href) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`link[href="${href}"]`)) {
                resolve();
                return;
            }
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            
            document.head.appendChild(link);
        });
    }

    onAllLoaded() {
        
        
        // Trigger enhanced loaded state
        document.body.classList.add('css-fully-loaded');
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('css-loaded', {
            detail: { loadedCount: this.loadedCount }
        }));
    }
}

// Auto-initialize
window.cssLazyLoader = new CSSLazyLoader();
