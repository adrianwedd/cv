/**
 * PWA Enhancements
 * Provides Progressive Web App functionality
 */

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/cv/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Install prompt handling
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Could show install button here if needed
});

// Handle app installed
window.addEventListener('appinstalled', (evt) => {
  console.log('App was installed');
});

// Offline functionality
window.addEventListener('online', () => {
  console.log('Back online');
});

window.addEventListener('offline', () => {
  console.log('Gone offline');
});