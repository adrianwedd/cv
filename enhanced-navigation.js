/**
 * Enhanced Navigation System - 2025 Professional UX
 * Features: Smooth scrollspy, progress indicator, keyboard shortcuts
 */

class EnhancedNavigation {
    constructor() {
        this.currentSection = 'about';
        this.sections = document.querySelectorAll('.section');
        this.navItems = document.querySelectorAll('.nav-item');
        this.progressBar = this.createProgressBar();
        this.isScrolling = false;
        this.scrollTimeout = null;
        
        this.init();
    }

    init() {
        this.setupScrollSpy();
        this.setupSmoothScrolling();
        this.setupProgressIndicator();
        this.setupKeyboardShortcuts();
        this.setupNavAnimation();
        this.setupMobileNavigation();
        
        console.log('🧭 Enhanced Navigation System initialized');
    }

    createProgressBar() {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'nav-progress-container';
        progressContainer.innerHTML = `
            <div class="nav-progress-bar">
                <div class="nav-progress-fill"></div>
            </div>
        `;
        
        const navigation = document.querySelector('.navigation');
        navigation.appendChild(progressContainer);
        
        return progressContainer.querySelector('.nav-progress-fill');
    }

    setupScrollSpy() {
        const observerOptions = {
            threshold: [0.1, 0.5, 0.9],
            rootMargin: '-10% 0px -10% 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            let activeSection = null;
            let maxRatio = 0;

            entries.forEach(entry => {
                if (entry.intersectionRatio > maxRatio && entry.intersectionRatio > 0.1) {
                    maxRatio = entry.intersectionRatio;
                    activeSection = entry.target.id;
                }
            });

            if (activeSection && activeSection !== this.currentSection) {
                this.updateActiveNavigation(activeSection);
                this.updateURL(activeSection);
            }
        }, observerOptions);

        this.sections.forEach(section => observer.observe(section));
    }

    setupSmoothScrolling() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = item.dataset.section;
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    this.scrollToSection(targetSection);
                    this.addClickFeedback(item);
                }
            });
        });
    }

    scrollToSection(section) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = section.offsetTop - headerHeight - 20;
        
        this.isScrolling = true;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });

        // Reset scrolling flag after animation completes
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            this.isScrolling = false;
        }, 1000);
    }

    setupProgressIndicator() {
        const updateProgress = () => {
            if (this.isScrolling) return;
            
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight - windowHeight;
            const scrollTop = window.scrollY;
            const progress = Math.min((scrollTop / documentHeight) * 100, 100);
            
            this.progressBar.style.width = `${progress}%`;
            
            // Update progress gradient based on current section
            const sectionColors = {
                about: 'var(--color-primary)',
                experience: 'var(--color-secondary)',
                projects: 'var(--color-accent)',
                skills: 'var(--color-info)',
                achievements: 'var(--color-success)'
            };
            
            const currentColor = sectionColors[this.currentSection] || 'var(--color-primary)';
            this.progressBar.style.background = `linear-gradient(90deg, ${currentColor}, ${currentColor}aa)`;
        };

        window.addEventListener('scroll', this.throttle(updateProgress, 16)); // 60fps
        updateProgress(); // Initial call
    }

    setupKeyboardShortcuts() {
        const shortcuts = {
            '1': 'about',
            '2': 'experience', 
            '3': 'projects',
            '4': 'skills',
            '5': 'achievements'
        };

        document.addEventListener('keydown', (e) => {
            // Only activate shortcuts when no input is focused
            if (document.activeElement.tagName.toLowerCase() === 'input') return;
            
            if (shortcuts[e.key]) {
                e.preventDefault();
                const targetSection = document.getElementById(shortcuts[e.key]);
                if (targetSection) {
                    this.scrollToSection(targetSection);
                    this.showShortcutFeedback(e.key, shortcuts[e.key]);
                }
            }
            
            // Arrow key navigation
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateByArrowKeys(e.key);
            }
        });
    }

    navigateByArrowKeys(direction) {
        const sectionIds = ['about', 'experience', 'projects', 'skills', 'achievements'];
        const currentIndex = sectionIds.indexOf(this.currentSection);
        
        let nextIndex;
        if (direction === 'ArrowDown') {
            nextIndex = Math.min(currentIndex + 1, sectionIds.length - 1);
        } else {
            nextIndex = Math.max(currentIndex - 1, 0);
        }
        
        const targetSection = document.getElementById(sectionIds[nextIndex]);
        if (targetSection) {
            this.scrollToSection(targetSection);
        }
    }

    setupNavAnimation() {
        // Add entrance animation for navigation items
        this.navItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(-20px)';
            item.style.transition = `all 0.3s ease ${index * 0.1}s`;
            
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 500 + (index * 100));
        });

        // Add hover animations
        this.navItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateY(-2px)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'translateY(0)';
            });
        });
    }

    setupMobileNavigation() {
        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchStartX - touchEndX;
            const deltaY = touchStartY - touchEndY;

            // Swipe detection
            if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
                if (deltaY > 0) {
                    // Swipe up - next section
                    this.navigateByArrowKeys('ArrowDown');
                } else {
                    // Swipe down - previous section
                    this.navigateByArrowKeys('ArrowUp');
                }
            }

            touchStartX = 0;
            touchStartY = 0;
        }, { passive: true });
    }

    updateActiveNavigation(sectionId) {
        this.currentSection = sectionId;
        
        this.navItems.forEach(item => {
            const isActive = item.dataset.section === sectionId;
            item.classList.toggle('active', isActive);
            
            if (isActive) {
                this.animateActiveIndicator(item);
            }
        });
    }

    animateActiveIndicator(activeItem) {
        // Remove existing indicator
        document.querySelectorAll('.nav-active-indicator').forEach(el => el.remove());
        
        // Create new indicator
        const indicator = document.createElement('div');
        indicator.className = 'nav-active-indicator';
        activeItem.appendChild(indicator);
        
        // Animate in
        setTimeout(() => {
            indicator.classList.add('active');
        }, 10);
    }

    updateURL(sectionId) {
        if (window.location.hash !== `#${sectionId}`) {
            history.replaceState(null, null, `#${sectionId}`);
        }
    }

    addClickFeedback(item) {
        item.classList.add('nav-clicked');
        setTimeout(() => {
            item.classList.remove('nav-clicked');
        }, 300);
    }

    showShortcutFeedback(key, section) {
        const feedback = document.createElement('div');
        feedback.className = 'shortcut-feedback';
        feedback.innerHTML = `
            <div class="shortcut-key">${key}</div>
            <div class="shortcut-section">${section}</div>
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.classList.add('visible');
        }, 10);
        
        setTimeout(() => {
            feedback.classList.remove('visible');
            setTimeout(() => {
                document.body.removeChild(feedback);
            }, 300);
        }, 1500);
    }

    throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        
        return function (...args) {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }

    // Public API
    navigateToSection(sectionId) {
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            this.scrollToSection(targetSection);
        }
    }

    getCurrentSection() {
        return this.currentSection;
    }

    destroy() {
        // Cleanup event listeners
        this.navItems.forEach(item => {
            item.replaceWith(item.cloneNode(true));
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedNavigation = new EnhancedNavigation();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedNavigation;
}