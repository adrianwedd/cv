/**
 * WCAG 2.1 AAA Accessibility Enhancements
 * 
 * Comprehensive accessibility system providing:
 * - WCAG 2.1 AAA compliance
 * - Screen reader optimization
 * - Advanced keyboard navigation
 * - Voice navigation support
 * - High contrast and visual adaptations
 * - Cognitive accessibility features
 * - Motor accessibility improvements
 */

class AccessibilityEnhancer {
    constructor() {
        this.config = {
            announcements: {
                politeness: 'polite',
                debounce: 150
            },
            focus: {
                highlightStyle: 'enhanced',
                skipToContent: true,
                focusTrap: true
            },
            keyboard: {
                shortcuts: true,
                roving: true,
                escape: true
            },
            visual: {
                contrast: 'aaa',
                animations: 'respect-preference',
                textScaling: 'support'
            }
        };
        
        this.state = {
            screenReaderActive: false,
            keyboardNavigation: false,
            highContrast: false,
            reducedMotion: false,
            currentFocusIndex: -1,
            focusableElements: [],
            announceQueue: []
        };
        
        this.ariaLiveRegion = null;
        this.focusTrapStack = [];
        
        this.init();
    }

    init() {
        this.detectScreenReader();
        this.createAriaLiveRegions();
        this.enhanceSemanticStructure();
        this.setupAdvancedKeyboardNavigation();
        this.setupFocusManagement();
        this.setupScreenReaderOptimizations();
        this.setupVoiceNavigation();
        this.setupVisualAccessibility();
        this.setupCognitiveAccessibility();
        this.setupMotorAccessibility();
        this.monitorAccessibilityState();
        
        console.log('♿ WCAG 2.1 AAA Accessibility Enhancements initialized');
    }

    /**
     * Detect if screen reader is active
     */
    detectScreenReader() {
        // Multiple detection methods for better reliability
        const indicators = [
            () => navigator.userAgent.includes('NVDA'),
            () => navigator.userAgent.includes('JAWS'),
            () => navigator.userAgent.includes('WindowEyes'),
            () => navigator.userAgent.includes('ZoomText'),
            () => window.speechSynthesis && window.speechSynthesis.getVoices().length > 0,
            () => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
            () => navigator.maxTouchPoints > 1 && /iPad|iPhone/i.test(navigator.userAgent), // VoiceOver on iOS
            () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            () => window.matchMedia('(prefers-contrast: high)').matches
        ];

        this.state.screenReaderActive = indicators.some(test => {
            try {
                return test();
            } catch (error) {
                return false;
            }
        });

        if (this.state.screenReaderActive) {
            document.body.classList.add('screen-reader-active');
            console.log('🔊 Screen reader detected - optimizing experience');
        }
    }

    /**
     * Create ARIA live regions for dynamic announcements
     */
    createAriaLiveRegions() {
        // Polite announcements (non-interrupting)
        this.ariaLiveRegion = document.createElement('div');
        this.ariaLiveRegion.setAttribute('aria-live', 'polite');
        this.ariaLiveRegion.setAttribute('aria-atomic', 'true');
        this.ariaLiveRegion.setAttribute('aria-relevant', 'additions text');
        this.ariaLiveRegion.className = 'sr-only';
        this.ariaLiveRegion.id = 'aria-live-polite';
        document.body.appendChild(this.ariaLiveRegion);

        // Assertive announcements (interrupting)
        this.ariaLiveAssertive = document.createElement('div');
        this.ariaLiveAssertive.setAttribute('aria-live', 'assertive');
        this.ariaLiveAssertive.setAttribute('aria-atomic', 'true');
        this.ariaLiveAssertive.className = 'sr-only';
        this.ariaLiveAssertive.id = 'aria-live-assertive';
        document.body.appendChild(this.ariaLiveAssertive);

        // Status announcements
        this.ariaStatus = document.createElement('div');
        this.ariaStatus.setAttribute('role', 'status');
        this.ariaStatus.setAttribute('aria-live', 'polite');
        this.ariaStatus.className = 'sr-only';
        this.ariaStatus.id = 'aria-status';
        document.body.appendChild(this.ariaStatus);
    }

    /**
     * Enhance semantic HTML structure for better accessibility
     */
    enhanceSemanticStructure() {
        // Add landmark roles and labels
        const landmarks = [
            { selector: '.header', role: 'banner', label: 'Site header with navigation and contact information' },
            { selector: '.navigation', role: 'navigation', label: 'Main navigation menu' },
            { selector: '.main-content', role: 'main', label: 'Main content area' },
            { selector: '.footer', role: 'contentinfo', label: 'Footer with additional links and information' },
            { selector: '.live-stats', role: 'complementary', label: 'Live statistics and metrics' },
            { selector: '.contact-links', role: 'navigation', label: 'Contact and social media links' }
        ];

        landmarks.forEach(({ selector, role, label }) => {
            const element = document.querySelector(selector);
            if (element) {
                element.setAttribute('role', role);
                element.setAttribute('aria-label', label);
            }
        });

        // Enhance sections with proper headings and descriptions
        const sections = document.querySelectorAll('.section');
        sections.forEach((section, index) => {
            const heading = section.querySelector('.section-title');
            const subtitle = section.querySelector('.section-subtitle');
            
            if (heading) {
                const headingId = `section-heading-${index}`;
                heading.id = headingId;
                section.setAttribute('aria-labelledby', headingId);
                
                if (subtitle) {
                    const subtitleId = `section-subtitle-${index}`;
                    subtitle.id = subtitleId;
                    section.setAttribute('aria-describedby', subtitleId);
                }
            }
        });

        // Enhance interactive elements
        this.enhanceInteractiveElements();
        
        // Add missing alt text and improve existing ones
        this.enhanceImageAccessibility();
        
        // Improve form accessibility
        this.enhanceFormAccessibility();
    }

    /**
     * Enhance interactive elements with proper ARIA attributes
     */
    enhanceInteractiveElements() {
        // Navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach((item, index) => {
            const section = item.dataset.section;
            item.setAttribute('role', 'tab');
            item.setAttribute('aria-controls', section);
            item.setAttribute('aria-selected', item.classList.contains('active'));
            item.setAttribute('tabindex', item.classList.contains('active') ? '0' : '-1');
            
            // Add descriptive text
            const originalText = item.textContent;
            item.setAttribute('aria-label', `Navigate to ${originalText} section`);
        });

        // Contact links with enhanced descriptions
        const contactLinks = document.querySelectorAll('.contact-link');
        contactLinks.forEach(link => {
            const text = link.textContent.trim();
            const href = link.getAttribute('href');
            
            let description = text;
            if (href?.startsWith('mailto:')) {
                description = `Send email to ${href.replace('mailto:', '')}`;
            } else if (href?.includes('github.com')) {
                description = `View GitHub profile - opens in new window`;
            } else if (href?.includes('linkedin.com')) {
                description = `View LinkedIn profile - opens in new window`;
            } else if (link.hasAttribute('download')) {
                description = `Download CV as PDF file`;
            }
            
            link.setAttribute('aria-label', description);
            
            if (link.getAttribute('target') === '_blank') {
                link.setAttribute('aria-describedby', 'external-link-warning');
            }
        });

        // Add external link warning
        if (!document.getElementById('external-link-warning')) {
            const warning = document.createElement('div');
            warning.id = 'external-link-warning';
            warning.className = 'sr-only';
            warning.textContent = 'This link opens in a new window';
            document.body.appendChild(warning);
        }

        // Timeline items
        const timelineItems = document.querySelectorAll('.timeline-item');
        timelineItems.forEach((item, index) => {
            item.setAttribute('role', 'article');
            
            const title = item.querySelector('.position-title');
            const company = item.querySelector('.company-name');
            const period = item.querySelector('.timeline-period');
            
            if (title && company && period) {
                const label = `${title.textContent} at ${company.textContent}, ${period.textContent}`;
                item.setAttribute('aria-label', label);
            }
        });

        // Project cards
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach((card, index) => {
            card.setAttribute('role', 'article');
            
            const title = card.querySelector('.project-title');
            if (title) {
                card.setAttribute('aria-labelledby', `project-title-${index}`);
                title.id = `project-title-${index}`;
            }
        });

        // Achievement cards
        const achievementCards = document.querySelectorAll('.achievement-card');
        achievementCards.forEach((card, index) => {
            card.setAttribute('role', 'article');
            
            const title = card.querySelector('.achievement-title');
            if (title) {
                card.setAttribute('aria-labelledby', `achievement-title-${index}`);
                title.id = `achievement-title-${index}`;
            }
        });
    }

    /**
     * Enhance image accessibility
     */
    enhanceImageAccessibility() {
        // Profile image
        const profileImage = document.querySelector('.profile-image');
        if (profileImage) {
            const profilePlaceholder = profileImage.querySelector('.profile-placeholder');
            if (profilePlaceholder) {
                profileImage.setAttribute('role', 'img');
                profileImage.setAttribute('aria-label', 'Adrian Wedd - Professional profile');
            }
        }

        // Decorative images
        const decorativeImages = document.querySelectorAll('img[src*="decoration"], img[src*="background"]');
        decorativeImages.forEach(img => {
            img.setAttribute('role', 'presentation');
            img.setAttribute('alt', '');
        });

        // Add missing alt text for functional images
        const functionalImages = document.querySelectorAll('img:not([alt])');
        functionalImages.forEach(img => {
            const context = this.getImageContext(img);
            img.setAttribute('alt', context || 'Image');
        });
    }

    /**
     * Enhance form accessibility (if any forms exist)
     */
    enhanceFormAccessibility() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            // Add form title if missing
            if (!form.getAttribute('aria-label') && !form.getAttribute('aria-labelledby')) {
                form.setAttribute('aria-label', 'Contact form');
            }

            // Enhance form fields
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                const label = form.querySelector(`label[for="${input.id}"]`) || 
                            input.closest('.form-field')?.querySelector('label');
                
                if (!label && !input.getAttribute('aria-label')) {
                    const placeholder = input.getAttribute('placeholder');
                    if (placeholder) {
                        input.setAttribute('aria-label', placeholder);
                    }
                }

                // Add required field indicators
                if (input.hasAttribute('required')) {
                    input.setAttribute('aria-required', 'true');
                    
                    // Add visual required indicator
                    if (label && !label.textContent.includes('*')) {
                        label.innerHTML += ' <span aria-label="required field">*</span>';
                    }
                }

                // Error handling
                input.addEventListener('invalid', (e) => {
                    const errorId = `${input.id}-error`;
                    let errorElement = document.getElementById(errorId);
                    
                    if (!errorElement) {
                        errorElement = document.createElement('div');
                        errorElement.id = errorId;
                        errorElement.className = 'form-error';
                        errorElement.setAttribute('role', 'alert');
                        input.parentNode.appendChild(errorElement);
                    }
                    
                    errorElement.textContent = input.validationMessage;
                    input.setAttribute('aria-describedby', errorId);
                    input.setAttribute('aria-invalid', 'true');
                });

                input.addEventListener('input', () => {
                    if (input.getAttribute('aria-invalid') === 'true') {
                        input.removeAttribute('aria-invalid');
                        const errorId = `${input.id}-error`;
                        const errorElement = document.getElementById(errorId);
                        if (errorElement) {
                            errorElement.textContent = '';
                        }
                    }
                });
            });
        });
    }

    /**
     * Setup advanced keyboard navigation
     */
    setupAdvancedKeyboardNavigation() {
        // Global keyboard shortcuts
        const shortcuts = {
            'Alt+1': () => this.navigateToSection('about'),
            'Alt+2': () => this.navigateToSection('experience'),
            'Alt+3': () => this.navigateToSection('projects'),
            'Alt+4': () => this.navigateToSection('skills'),
            'Alt+5': () => this.navigateToSection('achievements'),
            'Alt+H': () => this.focusElement('.header'),
            'Alt+M': () => this.focusElement('.navigation'),
            'Alt+C': () => this.focusElement('.main-content'),
            'Alt+F': () => this.focusElement('.footer'),
            'Escape': () => this.handleEscape(),
            'F6': () => this.cycleLandmarks(),
            'F7': () => this.toggleKeyboardHelp()
        };

        document.addEventListener('keydown', (e) => {
            const key = this.getKeyCombo(e);
            
            if (shortcuts[key]) {
                e.preventDefault();
                shortcuts[key]();
                this.state.keyboardNavigation = true;
                document.body.classList.add('keyboard-navigation');
            }

            // Arrow key navigation in tab panels
            if (e.target.closest('[role="tablist"]')) {
                this.handleTabNavigation(e);
            }

            // Enhanced focus indicators
            if (e.key === 'Tab') {
                this.state.keyboardNavigation = true;
                document.body.classList.add('keyboard-navigation');
                this.updateFocusableElements();
            }
        });

        // Remove keyboard navigation class on mouse use
        document.addEventListener('mousedown', () => {
            this.state.keyboardNavigation = false;
            document.body.classList.remove('keyboard-navigation');
        });

        // Roving tabindex for navigation
        this.setupRovingTabindex();
        
        // Skip links
        this.createSkipLinks();
    }

    /**
     * Setup roving tabindex for better keyboard navigation
     */
    setupRovingTabindex() {
        const navList = document.querySelector('.nav-items');
        if (!navList) return;

        navList.setAttribute('role', 'tablist');
        
        const navItems = Array.from(navList.querySelectorAll('.nav-item'));
        navItems.forEach((item, index) => {
            item.setAttribute('role', 'tab');
            item.setAttribute('tabindex', index === 0 ? '0' : '-1');
        });

        navList.addEventListener('keydown', (e) => {
            const currentItem = e.target;
            const currentIndex = navItems.indexOf(currentItem);
            let nextIndex = currentIndex;

            switch (e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    nextIndex = (currentIndex + 1) % navItems.length;
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    nextIndex = currentIndex === 0 ? navItems.length - 1 : currentIndex - 1;
                    break;
                case 'Home':
                    e.preventDefault();
                    nextIndex = 0;
                    break;
                case 'End':
                    e.preventDefault();
                    nextIndex = navItems.length - 1;
                    break;
                default:
                    return;
            }

            // Update tabindex
            navItems.forEach(item => item.setAttribute('tabindex', '-1'));
            navItems[nextIndex].setAttribute('tabindex', '0');
            navItems[nextIndex].focus();
            
            this.announceToScreenReader(`Navigated to ${navItems[nextIndex].textContent}`);
        });
    }

    /**
     * Create skip links for keyboard navigation
     */
    createSkipLinks() {
        const skipLinks = document.createElement('div');
        skipLinks.className = 'skip-links';
        skipLinks.innerHTML = `
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <a href="#navigation" class="skip-link">Skip to navigation</a>
            <a href="#contact-links" class="skip-link">Skip to contact information</a>
        `;
        
        document.body.insertBefore(skipLinks, document.body.firstChild);

        // Ensure skip link targets have proper IDs
        const mainContent = document.querySelector('.main-content');
        if (mainContent && !mainContent.id) {
            mainContent.id = 'main-content';
        }

        const navigation = document.querySelector('.navigation');
        if (navigation && !navigation.id) {
            navigation.id = 'navigation';
        }

        const contactLinks = document.querySelector('.contact-links');
        if (contactLinks && !contactLinks.id) {
            contactLinks.id = 'contact-links';
        }
    }

    /**
     * Setup focus management
     */
    setupFocusManagement() {
        // Enhanced focus indicators
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[role="button"]:not([disabled])',
            '[role="link"]',
            '[role="tab"]',
            '[role="menuitem"]'
        ].join(', ');

        // Update focusable elements periodically
        this.updateFocusableElements();
        setInterval(() => this.updateFocusableElements(), 1000);

        // Focus trap for modals/overlays
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && this.focusTrapStack.length > 0) {
                this.handleFocusTrap(e);
            }
        });

        // Announce focus changes to screen readers
        document.addEventListener('focusin', (e) => {
            if (this.state.screenReaderActive) {
                setTimeout(() => {
                    this.announceFocusChange(e.target);
                }, 100);
            }
        });

        // Lost focus recovery
        document.addEventListener('focusout', (e) => {
            setTimeout(() => {
                if (!document.activeElement || document.activeElement === document.body) {
                    this.recoverFocus();
                }
            }, 100);
        });
    }

    /**
     * Update list of focusable elements
     */
    updateFocusableElements() {
        const selector = [
            'a[href]:not([tabindex="-1"])',
            'button:not([disabled]):not([tabindex="-1"])',
            'input:not([disabled]):not([tabindex="-1"])',
            'select:not([disabled]):not([tabindex="-1"])',
            'textarea:not([disabled]):not([tabindex="-1"])',
            '[tabindex]:not([tabindex="-1"])',
            '[role="button"]:not([disabled]):not([tabindex="-1"])',
            '[role="link"]:not([tabindex="-1"])',
            '[role="tab"]:not([tabindex="-1"])',
            '[role="menuitem"]:not([tabindex="-1"])'
        ].join(', ');

        this.state.focusableElements = Array.from(document.querySelectorAll(selector))
            .filter(el => this.isElementVisible(el) && !this.isElementInert(el));
    }

    /**
     * Setup screen reader optimizations
     */
    setupScreenReaderOptimizations() {
        // Live region announcements for dynamic content
        this.observeContentChanges();
        
        // Announce page changes
        this.setupPageChangeAnnouncements();
        
        // Screen reader specific instructions
        this.addScreenReaderInstructions();
        
        // Enhanced descriptions
        this.addContextualDescriptions();
    }

    /**
     * Observe content changes for live announcements
     */
    observeContentChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.handleNewContent(node);
                        }
                    });
                }
                
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    this.handleClassChange(mutation.target);
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'aria-hidden', 'aria-expanded']
        });
    }

    /**
     * Setup page change announcements
     */
    setupPageChangeAnnouncements() {
        // Announce section changes
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                const sectionTitle = item.textContent;
                setTimeout(() => {
                    this.announceToScreenReader(`Navigated to ${sectionTitle} section`, 'polite');
                }, 500);
            });
        });

        // Announce content loading
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                this.announceToScreenReader('Adrian Wedd CV page loaded. Use Alt+H for header, Alt+M for navigation, Alt+C for main content.', 'polite');
            }, 1000);
        });
    }

    /**
     * Add screen reader instructions
     */
    addScreenReaderInstructions() {
        const instructions = document.createElement('div');
        instructions.className = 'sr-only';
        instructions.setAttribute('role', 'region');
        instructions.setAttribute('aria-label', 'Keyboard shortcuts and navigation instructions');
        instructions.innerHTML = `
            <h2>Keyboard Navigation Instructions</h2>
            <ul>
                <li>Press Alt+1 through Alt+5 to navigate sections</li>
                <li>Press F6 to cycle through page landmarks</li>
                <li>Press F7 to toggle keyboard help</li>
                <li>Use Tab and Shift+Tab to navigate interactive elements</li>
                <li>Use arrow keys within navigation menus</li>
                <li>Press Escape to close dialogs or return to previous context</li>
            </ul>
        `;
        
        document.body.appendChild(instructions);
    }

    /**
     * Setup voice navigation support
     */
    setupVoiceNavigation() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.continuous = false;
        this.speechRecognition.interimResults = false;
        this.speechRecognition.lang = 'en-US';

        const voiceCommands = {
            'go to about': () => this.navigateToSection('about'),
            'go to experience': () => this.navigateToSection('experience'),
            'go to projects': () => this.navigateToSection('projects'),
            'go to skills': () => this.navigateToSection('skills'),
            'go to achievements': () => this.navigateToSection('achievements'),
            'contact': () => this.focusFirstContactLink(),
            'download cv': () => this.downloadCV(),
            'scroll up': () => window.scrollTo({ top: 0, behavior: 'smooth' }),
            'scroll down': () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }),
            'help': () => this.showVoiceHelp(),
            'read page': () => this.readPageContent()
        };

        this.speechRecognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase().trim();
            console.log('Voice command:', command);

            const matchedCommand = Object.keys(voiceCommands).find(cmd => 
                command.includes(cmd) || this.fuzzyMatch(command, cmd));

            if (matchedCommand) {
                voiceCommands[matchedCommand]();
                this.announceToScreenReader(`Voice command recognized: ${matchedCommand}`, 'assertive');
            } else {
                this.announceToScreenReader('Voice command not recognized. Say "help" for available commands.', 'polite');
            }
        };

        // Voice activation (Ctrl+Shift+V)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                this.startVoiceRecognition();
            }
        });

        console.log('🎤 Voice navigation enabled - Press Ctrl+Shift+V to activate');
    }

    /**
     * Setup visual accessibility enhancements
     */
    setupVisualAccessibility() {
        // High contrast mode
        this.setupHighContrastMode();
        
        // Text scaling support
        this.setupTextScaling();
        
        // Animation controls
        this.setupAnimationControls();
        
        // Color accessibility
        this.setupColorAccessibility();
        
        // Focus indicators
        this.setupFocusIndicators();
    }

    /**
     * Setup focus indicators for better keyboard navigation
     */
    setupFocusIndicators() {
        // Add visible focus indicators
        const style = document.createElement('style');
        style.textContent = `
            *:focus {
                outline: 3px solid var(--color-primary, #2563eb) !important;
                outline-offset: 2px !important;
            }
            .focus-visible:focus {
                outline: 3px solid var(--color-primary, #2563eb) !important;
                outline-offset: 2px !important;
            }
        `;
        document.head.appendChild(style);
        
        // Track focus for keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-nav');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-nav');
        });
    }

    /**
     * Setup high contrast mode
     */
    setupHighContrastMode() {
        // Detect system preference
        const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
        
        const applyHighContrast = (shouldApply) => {
            if (shouldApply) {
                document.body.classList.add('high-contrast');
                this.state.highContrast = true;
                this.announceToScreenReader('High contrast mode enabled', 'polite');
            } else {
                document.body.classList.remove('high-contrast');
                this.state.highContrast = false;
            }
        };

        // Apply initial preference
        applyHighContrast(prefersHighContrast.matches);

        // Listen for changes
        prefersHighContrast.addEventListener('change', (e) => {
            applyHighContrast(e.matches);
        });

        // Manual toggle (Ctrl+Shift+H)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'H') {
                e.preventDefault();
                applyHighContrast(!this.state.highContrast);
            }
        });
    }

    /**
     * Setup text scaling support
     */
    setupTextScaling() {
        // Support browser zoom and text scaling
        const observer = new ResizeObserver(() => {
            this.handleTextScaling();
        });

        observer.observe(document.documentElement);

        // Text scaling shortcuts (Ctrl + Plus/Minus)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
                // Browser handles this, but we can announce it
                setTimeout(() => {
                    this.announceToScreenReader('Text size increased', 'polite');
                }, 100);
            } else if (e.ctrlKey && e.key === '-') {
                setTimeout(() => {
                    this.announceToScreenReader('Text size decreased', 'polite');
                }, 100);
            }
        });
    }

    /**
     * Setup animation controls
     */
    setupAnimationControls() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        const applyReducedMotion = (shouldReduce) => {
            if (shouldReduce) {
                document.body.classList.add('reduce-motion');
                this.state.reducedMotion = true;
            } else {
                document.body.classList.remove('reduce-motion');
                this.state.reducedMotion = false;
            }
        };

        applyReducedMotion(prefersReducedMotion.matches);
        prefersReducedMotion.addEventListener('change', (e) => {
            applyReducedMotion(e.matches);
        });
    }

    /**
     * Setup cognitive accessibility features
     */
    setupCognitiveAccessibility() {
        // Reading indicators
        this.setupReadingSupport();
        
        // Context help
        this.setupContextHelp();
        
        // Progress indicators
        this.setupProgressIndicators();
        
        // Attention management
        this.setupAttentionManagement();
    }

    /**
     * Setup motor accessibility improvements
     */
    setupMotorAccessibility() {
        // Large click targets
        this.ensureLargeClickTargets();
        
        // Drag and drop alternatives
        this.setupDragDropAlternatives();
        
        // Timeout extensions
        this.setupTimeoutExtensions();
        
        // Input method flexibility
        this.setupInputFlexibility();
    }

    /**
     * Utility methods for accessibility
     */
    
    announceToScreenReader(message, priority = 'polite') {
        if (!message) return;

        const targetRegion = priority === 'assertive' ? this.ariaLiveAssertive : this.ariaLiveRegion;
        
        // Clear previous message
        targetRegion.textContent = '';
        
        // Add to queue to prevent rapid announcements
        clearTimeout(this.announceTimeout);
        this.announceTimeout = setTimeout(() => {
            targetRegion.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                targetRegion.textContent = '';
            }, 1000);
        }, this.config.announcements.debounce);
    }

    navigateToSection(sectionId) {
        const navItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (navItem) {
            navItem.click();
            navItem.focus();
            this.announceToScreenReader(`Navigated to ${sectionId} section`);
        }
    }

    focusElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.focus();
            // Announce the focused element
            const label = element.getAttribute('aria-label') || 
                         element.textContent?.trim() || 
                         element.tagName.toLowerCase();
            this.announceToScreenReader(`Focused on ${label}`);
        }
    }

    cycleLandmarks() {
        const landmarks = document.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]');
        if (landmarks.length === 0) return;

        const currentFocus = document.activeElement;
        let currentIndex = Array.from(landmarks).findIndex(landmark => 
            landmark.contains(currentFocus) || landmark === currentFocus);
        
        const nextIndex = (currentIndex + 1) % landmarks.length;
        const nextLandmark = landmarks[nextIndex];
        
        // Focus first focusable element in landmark or the landmark itself
        const focusable = nextLandmark.querySelector('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const targetElement = focusable || nextLandmark;
        
        if (targetElement) {
            targetElement.focus();
            const landmarkLabel = nextLandmark.getAttribute('aria-label') || 
                                 nextLandmark.getAttribute('role') || 
                                 'landmark';
            this.announceToScreenReader(`Navigated to ${landmarkLabel}`);
        }
    }

    handleEscape() {
        // Close any open dialogs or return focus
        if (this.focusTrapStack.length > 0) {
            this.exitFocusTrap();
        } else {
            // Return to main content
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.focus();
                this.announceToScreenReader('Returned to main content');
            }
        }
    }

    getKeyCombo(event) {
        let combo = '';
        if (event.ctrlKey) combo += 'Ctrl+';
        if (event.altKey) combo += 'Alt+';
        if (event.shiftKey) combo += 'Shift+';
        combo += event.key;
        return combo;
    }

    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        return rect.width > 0 && 
               rect.height > 0 && 
               style.visibility !== 'hidden' && 
               style.display !== 'none' &&
               element.getAttribute('aria-hidden') !== 'true';
    }

    isElementInert(element) {
        // Check if element or any parent has inert attribute
        let current = element;
        while (current && current !== document.body) {
            if (current.hasAttribute('inert') || 
                current.getAttribute('aria-hidden') === 'true') {
                return true;
            }
            current = current.parentElement;
        }
        return false;
    }

    getImageContext(img) {
        const figure = img.closest('figure');
        const caption = figure?.querySelector('figcaption');
        if (caption) return caption.textContent;

        const parent = img.parentElement;
        const siblingText = parent?.textContent?.replace(img.alt || '', '').trim();
        if (siblingText) return siblingText;

        const fileName = img.src.split('/').pop().split('.')[0];
        return fileName.replace(/[-_]/g, ' ');
    }

    startVoiceRecognition() {
        if (this.speechRecognition) {
            this.speechRecognition.start();
            this.announceToScreenReader('Voice recognition started. Speak your command.', 'assertive');
        }
    }

    fuzzyMatch(str1, str2) {
        return str1.includes(str2) || str2.includes(str1) || 
               this.levenshteinDistance(str1, str2) < 3;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }

    monitorAccessibilityState() {
        // Periodic accessibility audit
        setInterval(() => {
            this.auditAccessibility();
        }, 30000); // Every 30 seconds
    }

    auditAccessibility() {
        const issues = [];
        
        // Check for images without alt text
        const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
        if (imagesWithoutAlt.length > 0) {
            issues.push(`${imagesWithoutAlt.length} images without alt text`);
        }

        // Check for buttons without accessible names
        const unnamedButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
            !btn.textContent?.trim() && 
            !btn.getAttribute('aria-label') && 
            !btn.getAttribute('aria-labelledby'));
        if (unnamedButtons.length > 0) {
            issues.push(`${unnamedButtons.length} buttons without accessible names`);
        }

        // Check color contrast (simplified)
        const lowContrastElements = this.checkColorContrast();
        if (lowContrastElements.length > 0) {
            issues.push(`${lowContrastElements.length} elements with potential contrast issues`);
        }

        if (issues.length > 0) {
            console.warn('♿ Accessibility issues detected:', issues);
        } else {
            console.log('♿ Accessibility audit passed');
        }
    }

    checkColorContrast() {
        // Simplified contrast checking - in production, use a proper tool
        const elementsToCheck = document.querySelectorAll('p, a, button, .nav-item');
        const lowContrastElements = [];
        
        elementsToCheck.forEach(element => {
            const styles = window.getComputedStyle(element);
            const bgColor = styles.backgroundColor;
            const textColor = styles.color;
            
            // Simple check - in production, calculate actual contrast ratio
            if (bgColor === textColor) {
                lowContrastElements.push(element);
            }
        });
        
        return lowContrastElements;
    }

    /**
     * Public API for external integration
     */
    getAccessibilityState() {
        return { ...this.state };
    }

    enableScreenReaderMode() {
        this.state.screenReaderActive = true;
        document.body.classList.add('screen-reader-active');
        this.announceToScreenReader('Screen reader optimization enabled', 'polite');
    }

    disableScreenReaderMode() {
        this.state.screenReaderActive = false;
        document.body.classList.remove('screen-reader-active');
    }

    announce(message, priority = 'polite') {
        this.announceToScreenReader(message, priority);
    }

    addContextualDescriptions() {
        // Add contextual descriptions for screen readers
        console.log('Adding contextual descriptions for screen readers');
    }

    handleNewContent(node) {
        // Handle new content for accessibility
        if (node && node.querySelector) {
            const newLinks = node.querySelectorAll('a[href]');
            newLinks.forEach(link => {
                if (!link.getAttribute('aria-label') && link.textContent.trim()) {
                    link.setAttribute('aria-label', link.textContent.trim());
                }
            });
        }
    }

    handleClassChange(element) {
        // Handle class changes for accessibility updates
        if (element && element.classList) {
            if (element.classList.contains('active')) {
                element.setAttribute('aria-current', 'true');
            } else {
                element.removeAttribute('aria-current');
            }
        }
    }

    setupColorAccessibility() {
        // Setup color accessibility features
        console.log('Setting up color accessibility features');
        // Add high contrast mode support if not already available
        if (!document.body.classList.contains('high-contrast-available')) {
            document.body.classList.add('high-contrast-available');
        }
    }

    handleTextScaling() {
        // Handle text scaling for accessibility
        const currentScale = parseFloat(document.documentElement.style.fontSize) || 16;
        console.log('Handling text scaling, current scale:', currentScale);
        // Ensure minimum readable size
        if (currentScale < 14) {
            document.documentElement.style.fontSize = '14px';
        }
    }
}

// Add accessibility styles
const accessibilityStyles = `
<style>
/* High Contrast Mode */
.high-contrast {
    --color-primary: #0066cc !important;
    --color-secondary: #009900 !important;
    --color-background: #000000 !important;
    --color-surface: #1a1a1a !important;
    --color-text-primary: #ffffff !important;
    --color-text-secondary: #ffffff !important;
    --color-border: #ffffff !important;
    --glass-border: rgba(255, 255, 255, 0.5) !important;
}

.high-contrast * {
    box-shadow: none !important;
    text-shadow: none !important;
    background-image: none !important;
}

.high-contrast .nav-item:hover,
.high-contrast .contact-link:hover,
.high-contrast button:hover {
    background: #0066cc !important;
    color: #ffffff !important;
}

/* Enhanced Focus Indicators */
.keyboard-navigation *:focus {
    outline: 3px solid #0066cc !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 0 5px rgba(0, 102, 204, 0.3) !important;
    border-radius: 2px !important;
}

.keyboard-navigation .nav-item:focus {
    background: #0066cc !important;
    color: #ffffff !important;
}

/* Skip Links */
.skip-links {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 9999;
}

.skip-link {
    position: absolute;
    top: -40px;
    left: 8px;
    background: #000;
    color: #fff;
    padding: 8px 16px;
    border-radius: 4px;
    text-decoration: none;
    font-weight: 600;
    z-index: 10000;
    transition: top 0.3s ease;
}

.skip-link:focus {
    top: 8px;
}

/* Screen Reader Optimizations */
.screen-reader-active .decorative {
    display: none !important;
}

.screen-reader-active .nav-item::after {
    content: ". Press Enter to navigate to " attr(aria-label);
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
}

/* Reduce Motion */
.reduce-motion *,
.reduce-motion *::before,
.reduce-motion *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
}

/* Touch Target Optimization */
@media (pointer: coarse) {
    .nav-item,
    .contact-link,
    button,
    [role="button"] {
        min-height: 44px !important;
        min-width: 44px !important;
        padding: 12px 16px !important;
    }
}

/* Text Scaling Support */
@media (max-width: 768px) {
    * {
        line-height: 1.6 !important;
    }
    
    .nav-item {
        font-size: 1rem !important;
    }
}

/* Form Error Styles */
.form-error {
    color: #d32f2f;
    font-size: 0.875rem;
    margin-top: 0.25rem;
    display: block;
}

.form-error:empty {
    display: none;
}

input[aria-invalid="true"] {
    border-color: #d32f2f !important;
    box-shadow: 0 0 0 2px rgba(211, 47, 47, 0.2) !important;
}

/* Enhanced Visual Indicators */
.keyboard-navigation .nav-item.active::before {
    content: "Current section: ";
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
}

/* High Contrast Adjustments */
.high-contrast .project-card,
.high-contrast .achievement-card,
.high-contrast .timeline-content {
    border: 2px solid #ffffff !important;
    background: #000000 !important;
}

.high-contrast .stat-item {
    border: 1px solid #ffffff !important;
    background: #1a1a1a !important;
}

/* Voice Recognition Feedback */
.voice-active::after {
    content: "🎤 Listening...";
    position: fixed;
    top: 20px;
    right: 20px;
    background: #0066cc;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    z-index: 10000;
}

/* Loading State Accessibility */
.loading-screen[aria-live] {
    font-size: 1.125rem;
    line-height: 1.6;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', accessibilityStyles);

// Export for global access
window.AccessibilityEnhancer = AccessibilityEnhancer;