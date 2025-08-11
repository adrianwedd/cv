/**
 * PWA Enhancements
 * Provides Progressive Web App functionality with advanced service worker management
 */

class PWAManager {
    constructor() {
        this.registration = null;
        this.isUpdateAvailable = false;
        this.deferredPrompt = null;
        
        this.init();
    }
    
    async init() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => this.registerServiceWorker());
            this.setupInstallPrompt();
            this.setupConnectivityHandling();
        }
    }
    
    async registerServiceWorker() {
        try {
            
            
            this.registration = await navigator.serviceWorker.register('/cv/sw.js');
            
            
            // Handle updates
            this.registration.addEventListener('updatefound', () => {
                
                const newWorker = this.registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        
                        this.handleUpdate();
                    }
                });
            });
            
            // Check for updates every 60 minutes
            setInterval(() => {
                this.registration.update();
            }, 60 * 60 * 1000);
            
            // Get cache stats
            this.getCacheStats();
            
        } catch (error) {
            console.error('❌ SW registration failed:', error);
        }
    }
    
    handleUpdate() {
        this.isUpdateAvailable = true;
        
        // Show update notification (subtle, non-intrusive)
        this.showUpdateNotification();
    }
    
    showUpdateNotification() {
        // Create a subtle update notification
        const notification = document.createElement('div');
        notification.className = 'sw-update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <span>🔄 Update available</span>
                <button onclick="pwaManager.applyUpdate()" class="update-btn">Refresh</button>
                <button onclick="this.parentElement.parentElement.remove()" class="dismiss-btn">×</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1e40af;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-size: 14px;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .update-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .update-btn {
                background: white;
                color: #1e40af;
                border: none;
                padding: 4px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
            }
            .dismiss-btn {
                background: none;
                color: white;
                border: none;
                cursor: pointer;
                font-size: 16px;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }
    
    async applyUpdate() {
        if (this.registration && this.registration.waiting) {
            // Tell the waiting service worker to take over
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            
            // Reload the page to get the new version
            window.location.reload();
        }
    }
    
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            
            // Could show custom install button here
            this.showInstallButton();
        });
        
        window.addEventListener('appinstalled', () => {
            
            this.deferredPrompt = null;
            this.hideInstallButton();
        });
    }
    
    showInstallButton() {
        // Add a subtle install button if not already installed
        if (!this.isInstalled()) {
            const installHint = document.createElement('div');
            installHint.className = 'pwa-install-hint';
            installHint.innerHTML = `
                <button onclick="pwaManager.promptInstall()" class="install-btn">
                    📱 Install App
                </button>
            `;
            
            installHint.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 999;
            `;
            
            document.body.appendChild(installHint);
        }
    }
    
    hideInstallButton() {
        const installHint = document.querySelector('.pwa-install-hint');
        if (installHint) {
            installHint.remove();
        }
    }
    
    async promptInstall() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const result = await this.deferredPrompt.userChoice;
            
            this.deferredPrompt = null;
        }
    }
    
    isInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches || 
               window.navigator.standalone === true;
    }
    
    setupConnectivityHandling() {
        window.addEventListener('online', () => {
            
            this.showConnectivityStatus('online');
        });
        
        window.addEventListener('offline', () => {
            
            this.showConnectivityStatus('offline');
        });
    }
    
    showConnectivityStatus(status) {
        const existing = document.querySelector('.connectivity-status');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'connectivity-status';
        notification.innerHTML = status === 'online' ? '🌐 Back online' : '📴 Offline mode';
        
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${status === 'online' ? '#10b981' : '#f59e0b'};
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            z-index: 1001;
            font-size: 14px;
            animation: fadeInOut 3s ease;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
                10%, 90% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
        `;
        
        if (!document.querySelector('style[data-connectivity]')) {
            style.setAttribute('data-connectivity', 'true');
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
    
    async getCacheStats() {
        if (!this.registration || !this.registration.active) return;
        
        const messageChannel = new MessageChannel();
        
        return new Promise((resolve) => {
            messageChannel.port1.onmessage = (event) => {
                if (event.data.type === 'CACHE_STATS_RESPONSE') {
                    
                    resolve(event.data);
                }
            };
            
            this.registration.active.postMessage(
                { type: 'CACHE_STATS' },
                [messageChannel.port2]
            );
        });
    }
}

// Initialize PWA Manager
const pwaManager = new PWAManager();

// Export for global access
window.pwaManager = pwaManager;