/**
 * Beautiful UI Enhancements
 * Premium visual effects and interactions
 */

class BeautifulUI {
    constructor() {
        this.init();
    }

    init() {
        this.createBackgroundAnimation();
        this.createParticles();
        this.enhanceScrollAnimations();
        this.addHoverEffects();
        this.initializeTypingEffect();
        this.addMagneticButtons();
        this.createProgressiveLoading();
        this.initParallaxEffects();
    }

    // Animated gradient background
    createBackgroundAnimation() {
        const bgAnimation = document.createElement('div');
        bgAnimation.className = 'bg-animation';
        bgAnimation.innerHTML = `
            <div class="gradient-orb orb-1"></div>
            <div class="gradient-orb orb-2"></div>
            <div class="gradient-orb orb-3"></div>
        `;
        document.body.appendChild(bgAnimation);

        // Dynamic orb movement on mouse
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            
            const orbs = document.querySelectorAll('.gradient-orb');
            orbs.forEach((orb, index) => {
                const speed = (index + 1) * 20;
                orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
            });
        });
    }

    // Particle effects
    createParticles() {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles';
        
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 20 + 10) + 's';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particlesContainer.appendChild(particle);
        }
        
        document.body.appendChild(particlesContainer);
    }

    // Enhanced scroll animations
    enhanceScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('in-view');
                        
                        // Add stagger effect for child elements
                        const children = entry.target.querySelectorAll('.animate-child');
                        children.forEach((child, i) => {
                            setTimeout(() => {
                                child.style.opacity = '1';
                                child.style.transform = 'translateY(0)';
                            }, i * 100);
                        });
                    }, index * 50);
                }
            });
        }, observerOptions);

        // Observe all sections and cards
        document.querySelectorAll('.section, .project-card, .achievement-card, .timeline-item').forEach(el => {
            observer.observe(el);
        });
    }

    // Hover effects with ripples
    addHoverEffects() {
        const buttons = document.querySelectorAll('.contact-link, .nav-item, .project-link');
        
        buttons.forEach(button => {
            button.addEventListener('mouseenter', function(e) {
                const ripple = document.createElement('span');
                ripple.className = 'ripple-effect';
                this.appendChild(ripple);
                
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                
                setTimeout(() => ripple.remove(), 600);
            });
        });
    }

    // Typing effect for tagline
    initializeTypingEffect() {
        const tagline = document.querySelector('.tagline');
        if (!tagline) return;

        const text = tagline.textContent;
        tagline.textContent = '';
        tagline.style.opacity = '1';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                tagline.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        };
        
        setTimeout(typeWriter, 1000);
    }

    // Magnetic button effect
    addMagneticButtons() {
        const magneticElements = document.querySelectorAll('.contact-link, .project-link');
        
        magneticElements.forEach(elem => {
            elem.addEventListener('mousemove', function(e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                this.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) scale(1.05)`;
            });
            
            elem.addEventListener('mouseleave', function() {
                this.style.transform = '';
            });
        });
    }

    // Progressive content loading
    createProgressiveLoading() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // Parallax scrolling effects
    initParallaxEffects() {
        let ticking = false;
        
        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            
            // Don't apply parallax to header - it should stay fixed
            // Header has position:sticky, so parallax breaks it
            
            // Parallax for background orbs
            const orbs = document.querySelectorAll('.gradient-orb');
            orbs.forEach((orb, index) => {
                const speed = (index + 1) * 0.2;
                orb.style.transform = `translateY(${scrolled * speed}px)`;
            });
            
            // Stats counter animation
            const stats = document.querySelectorAll('.stat-value');
            stats.forEach(stat => {
                const rect = stat.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    if (!stat.classList.contains('counted')) {
                        this.animateCounter(stat);
                        stat.classList.add('counted');
                    }
                }
            });
            
            ticking = false;
        };
        
        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', requestTick);
    }

    // Animated counter for stats
    animateCounter(element) {
        const target = parseInt(element.textContent);
        if (isNaN(target)) return;
        
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }
}

// Smooth reveal animation
class SmoothReveal {
    constructor() {
        this.reveal();
    }

    reveal() {
        const reveals = document.querySelectorAll('.reveal');
        
        window.addEventListener('scroll', () => {
            reveals.forEach(element => {
                const windowHeight = window.innerHeight;
                const elementTop = element.getBoundingClientRect().top;
                const elementVisible = 150;
                
                if (elementTop < windowHeight - elementVisible) {
                    element.classList.add('active');
                }
            });
        });
    }
}

// Cursor effects
class CustomCursor {
    constructor() {
        this.cursor = document.createElement('div');
        this.cursorFollower = document.createElement('div');
        this.cursor.className = 'custom-cursor';
        this.cursorFollower.className = 'cursor-follower';
        
        document.body.appendChild(this.cursor);
        document.body.appendChild(this.cursorFollower);
        
        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => {
            this.cursor.style.left = e.clientX + 'px';
            this.cursor.style.top = e.clientY + 'px';
            
            setTimeout(() => {
                this.cursorFollower.style.left = e.clientX + 'px';
                this.cursorFollower.style.top = e.clientY + 'px';
            }, 100);
        });

        // Cursor interactions
        const interactiveElements = document.querySelectorAll('a, button, .nav-item');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.cursor.classList.add('hover');
                this.cursorFollower.classList.add('hover');
            });
            
            el.addEventListener('mouseleave', () => {
                this.cursor.classList.remove('hover');
                this.cursorFollower.classList.remove('hover');
            });
        });
    }
}

// Add custom cursor styles
const cursorStyles = `
    .custom-cursor {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(102, 126, 234, 0.8);
        border-radius: 50%;
        position: fixed;
        pointer-events: none;
        transition: all 0.1s ease;
        z-index: 9999;
        mix-blend-mode: difference;
    }
    
    .cursor-follower {
        width: 40px;
        height: 40px;
        background: rgba(102, 126, 234, 0.1);
        border-radius: 50%;
        position: fixed;
        pointer-events: none;
        transition: all 0.3s ease;
        z-index: 9998;
    }
    
    .custom-cursor.hover {
        transform: scale(2);
        background: rgba(102, 126, 234, 0.2);
    }
    
    .cursor-follower.hover {
        transform: scale(1.5);
        background: rgba(102, 126, 234, 0.2);
    }
    
    .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add cursor styles
    const style = document.createElement('style');
    style.textContent = cursorStyles;
    document.head.appendChild(style);
    
    // Initialize beautiful UI
    new BeautifulUI();
    new SmoothReveal();
    
    // Add custom cursor only on desktop
    if (window.innerWidth > 768) {
        new CustomCursor();
    }
    
    // Smooth page transitions
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add loading complete animation
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
        
        // Stagger animations for initial load
        const animatedElements = document.querySelectorAll('.stat-item, .contact-link');
        animatedElements.forEach((el, index) => {
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 100);
        });
    });
});