/**
 * Cache Buster - Force refresh of all assets
 */

(function() {
    console.log('🔄 Cache Buster Active - Forcing Fresh Assets');
    
    // Clear all caches
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                caches.delete(name);
                console.log(`🗑️ Cleared cache: ${name}`);
            });
        });
    }
    
    // Unregister service worker to force fresh load
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                registration.unregister();
                console.log('🔧 Service worker unregistered');
            });
        });
    }
    
    // Add version query to all stylesheets to force reload
    const version = Date.now();
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    stylesheets.forEach(link => {
        const href = link.href.split('?')[0];
        link.href = href + '?v=' + version;
        console.log(`🎨 Refreshed stylesheet: ${href}`);
    });
    
    // Force reload after clearing
    const shouldReload = !window.location.search.includes('refreshed=true');
    if (shouldReload) {
        setTimeout(() => {
            console.log('🚀 Forcing page reload with fresh assets...');
            window.location.href = window.location.pathname + '?refreshed=true&t=' + Date.now();
        }, 500);
    } else {
        console.log('✅ Fresh assets loaded!');
    }
})();