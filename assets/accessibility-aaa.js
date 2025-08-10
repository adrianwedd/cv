/**
 * WCAG 2.1 AAA Accessibility Enhancements
 * Comprehensive accessibility improvements for maximum inclusion
 * Target: 95%+ accessibility score, AAA compliance
 */

class AccessibilityAAA {
    constructor() {
        this.announcements = [];
        this.focusHistory = [];
        this.screenReader = this.detectScreenReader();
        this.highContrast = window.matchMedia('(prefers-contrast: high)').matches;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        this.init();
    }

    init() {
        console.log('♿ Initializing WCAG 2.1 AAA Accessibility Enhancements');
        
        this.setupARIAEnhancements();
        this.setupKeyboardNavigation();
        this.setupScreenReaderSupport();
        this.setupFocusManagement();
        this.setupColorContrastEnhancements();
        this.setupMotionPreferences();
        this.setupTextAlternatives();
        this.setupLiveRegions();
        this.setupHeadingStructure();
        this.setupLandmarkRoles();
        
        console.log('✅ WCAG 2.1 AAA Accessibility initialized');
    }

    /**
     * Detect screen reader usage
     */
    detectScreenReader() {
        // Check for common screen readers
        const userAgent = navigator.userAgent.toLowerCase();
        const screenReaders = ['nvda', 'jaws', 'voiceover', 'orca', 'dragon'];
        
        return screenReaders.some(sr => userAgent.includes(sr)) ||
               window.speechSynthesis ||
               navigator.userAgent.includes('aural');
    }

    /**
     * Enhanced ARIA attributes and relationships
     */
    setupARIAEnhancements() {
        // Navigation enhancements
        const navigation = document.querySelector('.navigation');
        if (navigation) {
            navigation.setAttribute('role', 'navigation');
            navigation.setAttribute('aria-label', 'Main navigation');
            
            const navItems = navigation.querySelectorAll('.nav-item');
            navItems.forEach((item, index) => {
                item.setAttribute('role', 'tab');
                item.setAttribute('aria-selected', item.classList.contains('active'));
                item.setAttribute('aria-controls', item.dataset.section);
                item.setAttribute('tabindex', item.classList.contains('active') ? '0' : '-1');
                
                // Add position information
                item.setAttribute('aria-setsize', navItems.length);
                item.setAttribute('aria-posinset', index + 1);
            });
            
            // Tab list container
            const navContainer = navigation.querySelector('.nav-items');
            if (navContainer) {
                navContainer.setAttribute('role', 'tablist');
                navContainer.setAttribute('aria-orientation', 'horizontal');
            }
        }

        // Main content sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.setAttribute('role', 'tabpanel');
            section.setAttribute('aria-labelledby', `${section.id}-heading`);
            
            const heading = section.querySelector('.section-title');
            if (heading) {
                heading.id = `${section.id}-heading`;
            }
        });

        // Contact links
        const contactLinks = document.querySelectorAll('.contact-link');
        contactLinks.forEach(link => {
            const linkText = link.textContent.trim();
            const url = link.href;
            
            if (url.startsWith('mailto:')) {
                link.setAttribute('aria-label', `Send email: ${linkText}`);
            } else if (this.isValidDomain(url, 'github.com')) {
                link.setAttribute('aria-label', `View GitHub profile: ${linkText}`);
            } else if (this.isValidDomain(url, 'linkedin.com')) {
                link.setAttribute('aria-label', `View LinkedIn profile: ${linkText}`);
            } else if (link.hasAttribute('download')) {
                link.setAttribute('aria-label', `Download CV as PDF: ${linkText}`);
            } else if (url.startsWith('http')) {
                link.setAttribute('aria-label', `External link: ${linkText} (opens in new tab)`);
            }
        });

        // Project cards
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach((card, index) => {
            card.setAttribute('role', 'article');
            card.setAttribute('aria-labelledby', `project-${index}-title`);
            
            const title = card.querySelector('.project-title');
            if (title) {
                title.id = `project-${index}-title`;
            }
        });

        // Statistics
        const statItems = document.querySelectorAll('.stat-item');
        statItems.forEach((stat, index) => {
            const value = stat.querySelector('.stat-value');
            const label = stat.querySelector('.stat-label');
            
            if (value && label) {
                const statId = `stat-${index}`;
                value.id = `${statId}-value`;
                label.id = `${statId}-label`;
                
                stat.setAttribute('role', 'img');
                stat.setAttribute('aria-labelledby', `${statId}-value ${statId}-label`);
                
                // Add descriptive text for screen readers
                const description = `${value.textContent} ${label.textContent}`;
                stat.setAttribute('aria-label', description);
            }
        });
    }

    /**
     * Enhanced keyboard navigation
     */
    setupKeyboardNavigation() {
        // Tab navigation for main nav
        document.addEventListener('keydown', (e) => {
            const activeElement = document.activeElement;
            
            if (activeElement && activeElement.classList.contains('nav-item')) {
                const navItems = Array.from(document.querySelectorAll('.nav-item'));
                const currentIndex = navItems.indexOf(activeElement);
                
                let newIndex = currentIndex;
                
                switch (e.key) {
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        e.preventDefault();
                        newIndex = currentIndex > 0 ? currentIndex - 1 : navItems.length - 1;
                        break;
                        
                    case 'ArrowRight':
                    case 'ArrowDown':
                        e.preventDefault();
                        newIndex = currentIndex < navItems.length - 1 ? currentIndex + 1 : 0;
                        break;
                        
                    case 'Home':
                        e.preventDefault();
                        newIndex = 0;
                        break;
                        
                    case 'End':
                        e.preventDefault();
                        newIndex = navItems.length - 1;
                        break;
                        
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        activeElement.click();
                        return;
                }
                
                if (newIndex !== currentIndex) {
                    // Update tabindex
                    navItems[currentIndex].setAttribute('tabindex', '-1');
                    navItems[newIndex].setAttribute('tabindex', '0');
                    navItems[newIndex].focus();
                }
            }
            
            // Skip links
            if (e.key === 'Tab' && !e.shiftKey) {
                this.showSkipLinks();
            }
            
            // Escape key handling
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });

        // Focus indicators
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    /**
     * Enhanced screen reader support
     */
    setupScreenReaderSupport() {
        // Add descriptive labels
        this.addScreenReaderLabels();
        
        // Setup announcement system
        this.createAnnouncementRegion();
        
        // Handle dynamic content changes
        this.setupContentChangeAnnouncements();
        
        // Loading state announcements
        this.setupLoadingAnnouncements();
    }

    addScreenReaderLabels() {
        // Profile image
        const profileImage = document.querySelector('.profile-image');
        if (profileImage) {
            profileImage.setAttribute('role', 'img');
            profileImage.setAttribute('aria-label', 'Adrian Wedd profile photo');
        }

        // Loading spinner
        const loadingSpinner = document.querySelector('.loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.setAttribute('aria-label', 'Loading content');
            loadingSpinner.setAttribute('role', 'status');
        }

        // External link indicators
        const externalLinks = document.querySelectorAll('a[target="_blank"]');
        externalLinks.forEach(link => {
            const currentLabel = link.getAttribute('aria-label') || link.textContent;
            link.setAttribute('aria-label', `${currentLabel} (opens in new tab)`);
        });
    }

    createAnnouncementRegion() {
        const announcer = document.createElement('div');
        announcer.id = 'screen-reader-announcer';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'visually-hidden';
        announcer.style.cssText = `
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0,0,0,0) !important;
            white-space: nowrap !important;
            border: 0 !important;
        `;
        
        document.body.appendChild(announcer);
        this.announcer = announcer;
    }

    announce(message, priority = 'polite') {
        if (!this.announcer) return;
        
        this.announcer.setAttribute('aria-live', priority);
        this.announcer.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
            this.announcer.textContent = '';
        }, 1000);
        
        console.log(`📢 Screen reader announcement: ${message}`);
    }

    setupContentChangeAnnouncements() {
        // Section changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const element = mutation.target;
                    
                    if (element.classList.contains('section') && element.classList.contains('active')) {
                        const heading = element.querySelector('.section-title');
                        if (heading) {
                            this.announce(`Navigated to ${heading.textContent} section`);
                        }
                    }
                }
            });
        });

        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            observer.observe(section, { attributes: true, attributeFilter: ['class'] });
        });
    }

    setupLoadingAnnouncements() {
        // Loading completion
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (loadingScreen.classList.contains('hidden')) {
                            setTimeout(() => {
                                this.announce('Page loaded successfully');
                            }, 500);
                        }
                    }
                });
            });
            
            observer.observe(loadingScreen, { attributes: true, attributeFilter: ['class'] });
        }
    }

    /**
     * Advanced focus management
     */
    setupFocusManagement() {
        // Focus history for restoration
        document.addEventListener('focusin', (e) => {
            this.focusHistory.push(e.target);
            if (this.focusHistory.length > 10) {
                this.focusHistory.shift();
            }
        });

        // Focus visible enhancements
        this.setupFocusVisible();
        
        // Modal focus trapping (if modals are added)
        this.setupFocusTrap();
        
        // Skip links
        this.setupSkipLinks();
    }

    setupFocusVisible() {
        // Only show focus outlines for keyboard navigation
        document.body.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-focus');
            }
        });

        document.body.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-focus');
        });
    }

    setupFocusTrap() {
        const focusableSelector = 'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex="0"]';
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const modal = document.querySelector('.modal.active, .overlay.active');
                if (modal) {
                    const focusableElements = modal.querySelectorAll(focusableSelector);
                    const firstElement = focusableElements[0];
                    const lastElement = focusableElements[focusableElements.length - 1];
                    
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            }
        });
    }

    setupSkipLinks() {
        const skipLinks = document.querySelectorAll('.skip-link');
        skipLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                
                if (target) {
                    target.setAttribute('tabindex', '-1');
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth' });
                    
                    this.announce(`Skipped to ${target.tagName.toLowerCase()}`);
                }
            });
        });
    }

    showSkipLinks() {
        const skipLinks = document.querySelectorAll('.skip-link');
        skipLinks.forEach(link => {
            link.style.position = 'fixed';
            link.style.top = '8px';
            link.style.left = '8px';
            link.style.zIndex = '10000';
        });
    }

    /**
     * Color contrast enhancements
     */
    setupColorContrastEnhancements() {
        if (this.highContrast) {
            document.documentElement.classList.add('high-contrast');
            this.announce('High contrast mode enabled');
        }

        // Monitor contrast preference changes
        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            if (e.matches) {
                document.documentElement.classList.add('high-contrast');
                this.announce('High contrast mode enabled');
            } else {
                document.documentElement.classList.remove('high-contrast');
                this.announce('High contrast mode disabled');
            }
        });
    }

    /**
     * Motion and animation preferences
     */
    setupMotionPreferences() {
        if (this.reducedMotion) {
            document.documentElement.classList.add('reduced-motion');
            this.announce('Reduced motion mode enabled');
        }

        // Monitor motion preference changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            if (e.matches) {
                document.documentElement.classList.add('reduced-motion');
                this.disableAnimations();
                this.announce('Animations reduced for accessibility');
            } else {
                document.documentElement.classList.remove('reduced-motion');
                this.announce('Animations enabled');
            }
        });
    }

    disableAnimations() {
        const style = document.createElement('style');
        style.id = 'reduced-motion-override';
        style.textContent = `
            .reduced-motion *,
            .reduced-motion *::before,
            .reduced-motion *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
        `;
        
        if (!document.getElementById('reduced-motion-override')) {
            document.head.appendChild(style);
        }
    }

    /**
     * Text alternatives and descriptions
     */
    setupTextAlternatives() {
        // Images without alt text
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
            if (!img.hasAttribute('alt')) {
                // Provide contextual alt text
                const context = this.getImageContext(img);
                img.setAttribute('alt', context || `Image ${index + 1}`);
            }
        });

        // Background images
        const bgImages = document.querySelectorAll('[style*="background-image"]');
        bgImages.forEach((element, index) => {
            if (!element.getAttribute('role')) {
                element.setAttribute('role', 'img');
                element.setAttribute('aria-label', `Background image ${index + 1}`);
            }
        });

        // Icons and symbols
        const icons = document.querySelectorAll('.icon, [class*="icon-"]');
        icons.forEach(icon => {
            if (!icon.getAttribute('aria-label') && !icon.getAttribute('aria-hidden')) {
                const context = this.getIconContext(icon);
                if (context) {
                    icon.setAttribute('aria-label', context);
                } else {
                    icon.setAttribute('aria-hidden', 'true');
                }
            }
        });
    }

    getImageContext(img) {
        const parent = img.parentElement;
        if (parent) {
            const heading = parent.querySelector('h1, h2, h3, h4, h5, h6');
            if (heading) {
                return `Image for ${heading.textContent.trim()}`;
            }
            
            const text = parent.textContent.trim();
            if (text.length > 0 && text.length < 100) {
                return `Image: ${text}`;
            }
        }
        return null;
    }

    getIconContext(icon) {
        const parent = icon.parentElement;
        if (parent) {
            const text = parent.textContent.replace(icon.textContent, '').trim();
            if (text) {
                return `Icon for ${text}`;
            }
        }
        return null;
    }

    /**
     * Live regions for dynamic content
     */
    setupLiveRegions() {
        // Status updates
        const statusRegion = document.createElement('div');
        statusRegion.id = 'status-region';
        statusRegion.setAttribute('aria-live', 'polite');
        statusRegion.setAttribute('aria-label', 'Status updates');
        statusRegion.className = 'visually-hidden';
        document.body.appendChild(statusRegion);

        // Error region
        const errorRegion = document.createElement('div');
        errorRegion.id = 'error-region';
        errorRegion.setAttribute('aria-live', 'assertive');
        errorRegion.setAttribute('aria-label', 'Error messages');
        errorRegion.className = 'visually-hidden';
        document.body.appendChild(errorRegion);

        this.statusRegion = statusRegion;
        this.errorRegion = errorRegion;
    }

    announceStatus(message) {
        if (this.statusRegion) {
            this.statusRegion.textContent = message;
            setTimeout(() => {
                this.statusRegion.textContent = '';
            }, 5000);
        }
    }

    announceError(message) {
        if (this.errorRegion) {
            this.errorRegion.textContent = message;
            setTimeout(() => {
                this.errorRegion.textContent = '';
            }, 10000);
        }
    }

    /**
     * Proper heading structure
     */
    setupHeadingStructure() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const structure = [];
        
        headings.forEach(heading => {
            const level = parseInt(heading.tagName.charAt(1));
            structure.push({ element: heading, level });
        });
        
        // Validate heading hierarchy
        this.validateHeadingStructure(structure);
    }

    validateHeadingStructure(structure) {
        let errors = [];
        let previousLevel = 0;
        
        structure.forEach(({ element, level }, index) => {
            if (index === 0 && level !== 1) {
                errors.push(`First heading should be h1, found h${level}`);
            }
            
            if (level > previousLevel + 1) {
                errors.push(`Heading level skip: h${previousLevel} to h${level}`);
            }
            
            previousLevel = level;
        });
        
        if (errors.length > 0) {
            console.warn('♿ Heading structure issues:', errors);
        } else {
            console.log('✅ Heading structure is valid');
        }
    }

    /**
     * Landmark roles
     */
    setupLandmarkRoles() {
        // Main content
        const main = document.querySelector('main, #main-content, .main-content');
        if (main && !main.getAttribute('role')) {
            main.setAttribute('role', 'main');
        }

        // Navigation
        const nav = document.querySelector('nav, .navigation');
        if (nav && !nav.getAttribute('role')) {
            nav.setAttribute('role', 'navigation');
        }

        // Header
        const header = document.querySelector('header, .header');
        if (header && !header.getAttribute('role')) {
            header.setAttribute('role', 'banner');
        }

        // Footer
        const footer = document.querySelector('footer, .footer');
        if (footer && !footer.getAttribute('role')) {
            footer.setAttribute('role', 'contentinfo');
        }

        // Complementary content
        const aside = document.querySelector('aside, .sidebar');
        if (aside && !aside.getAttribute('role')) {
            aside.setAttribute('role', 'complementary');
        }
    }

    /**
     * Secure URL domain validation to prevent bypass attacks
     */
    isValidDomain(url, expectedDomain) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();
            const domain = expectedDomain.toLowerCase();
            
            // Exact match or subdomain match
            return hostname === domain || hostname.endsWith('.' + domain);
        } catch (error) {
            // Invalid URL format
            return false;
        }
    }

    /**
     * Handle escape key globally
     */
    handleEscapeKey() {
        // Close any open overlays
        const openOverlays = document.querySelectorAll('.modal.active, .overlay.active, .dropdown.open');
        openOverlays.forEach(overlay => {
            overlay.classList.remove('active', 'open');
        });

        // Return focus to previous element
        if (this.focusHistory.length > 1) {
            const previousFocus = this.focusHistory[this.focusHistory.length - 2];
            if (previousFocus && document.contains(previousFocus)) {
                previousFocus.focus();
            }
        }
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        // Remove added elements
        const announcer = document.getElementById('screen-reader-announcer');
        if (announcer) announcer.remove();
        
        const statusRegion = document.getElementById('status-region');
        if (statusRegion) statusRegion.remove();
        
        const errorRegion = document.getElementById('error-region');
        if (errorRegion) errorRegion.remove();
        
        const reducedMotionStyle = document.getElementById('reduced-motion-override');
        if (reducedMotionStyle) reducedMotionStyle.remove();
        
        console.log('🧹 Accessibility AAA cleaned up');
    }
}

// Add required CSS for accessibility enhancements
const style = document.createElement('style');
style.textContent = `
    /* Enhanced focus indicators */
    .keyboard-focus *:focus,
    .keyboard-navigation *:focus {
        outline: 3px solid #60a5fa !important;
        outline-offset: 2px !important;
        border-radius: 4px !important;
    }
    
    /* High contrast mode */
    .high-contrast {
        --color-text-primary: #ffffff !important;
        --color-text-secondary: #ffffff !important;
        --color-text-muted: #e5e5e5 !important;
        --color-border: #ffffff !important;
    }
    
    .high-contrast .nav-item.active {
        background: #ffffff !important;
        color: #000000 !important;
    }
    
    .high-contrast .contact-link:hover {
        background: #ffffff !important;
        color: #000000 !important;
    }
    
    /* Skip links */
    .skip-link {
        position: absolute !important;
        top: -40px !important;
        left: 8px !important;
        background: var(--color-primary) !important;
        color: white !important;
        padding: 8px 16px !important;
        border-radius: 4px !important;
        text-decoration: none !important;
        font-weight: 500 !important;
        z-index: 10000 !important;
        transition: top 0.3s ease !important;
    }
    
    .skip-link:focus {
        top: 8px !important;
        outline: 3px solid #ffffff !important;
        outline-offset: 2px !important;
    }
    
    /* Visually hidden but screen reader accessible */
    .visually-hidden {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
    }
    
    /* Reduced motion overrides */
    .reduced-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
    
    /* Enhanced touch targets for mobile */
    @media (pointer: coarse) {
        .nav-item,
        .contact-link,
        button,
        a {
            min-height: 44px !important;
            min-width: 44px !important;
        }
    }
    
    /* Print accessibility */
    @media print {
        .visually-hidden {
            position: static !important;
            width: auto !important;
            height: auto !important;
            padding: initial !important;
            margin: initial !important;
            overflow: visible !important;
            clip: auto !important;
            white-space: normal !important;
        }
        
        .skip-link {
            display: none !important;
        }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.accessibilityAAA = new AccessibilityAAA();
    });
} else {
    window.accessibilityAAA = new AccessibilityAAA();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityAAA;
}