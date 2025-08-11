/**
 * Cache Buster - Force refresh of all assets
 */

(function() {
    
    
    // Clear all caches
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                caches.delete(name);
                
            });
        });
    }
    
    // Unregister service worker to force fresh load
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                registration.unregister();
                
            });
        });
    }
    
    // Add version query to all stylesheets to force reload
    const version = Date.now();
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    stylesheets.forEach(link => {
        const href = link.href.split('?')[0];
        link.href = href + '?v=' + version;
        
    });
    
    // Force reload after clearing
    const shouldReload = !window.location.search.includes('refreshed=true');
    if (shouldReload) {
        setTimeout(() => {
            
            window.location.href = window.location.pathname + '?refreshed=true&t=' + Date.now();
        }, 500);
    } else {
        
    }
})();