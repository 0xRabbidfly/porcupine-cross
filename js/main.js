/**
 * Main Application
 * Orchestrates all components and handles initialization
 */

import AudioManager from './components/audioManager.js';
import { CountdownTimer } from './components/countdownTimer.js';
import InteractiveMap from './components/interactiveMap.js';
import eventBus from './core/eventBus.js';
import { getElements, getElement, addEventListeners } from './utils/domUtils.js';
import { createMudSplat, createViewportWideMudSplat } from './utils/animationUtils.js';

// Log initialization start
console.log('Main module loaded');

// Application class
class App {
  constructor() {
    this.components = {};
    this.initialized = false;
    this.isMenuOpen = false;
    console.log('App constructed');
  }
  
  /**
   * Initialize the application
   */
  init() {
    console.log('App.init() called, readyState:', document.readyState);
    // Wait for DOM content to be loaded
    if (document.readyState === 'loading') {
      console.log('Document still loading, adding DOMContentLoaded listener');
      document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded fired');
        this.initComponents();
        this.initSectionObserver();
        this.initAnimationEffects();
      });
    } else {
      console.log('Document already loaded, initializing components directly');
      this.initComponents();
      this.initSectionObserver();
      this.initAnimationEffects();
    }
    
    // Set up smooth scrolling for anchor links
    this.initSmoothScrolling();
    
    return this;
  }
  
  /**
   * Initialize all components
   */
  initComponents() {
    console.log('initComponents called, initialized:', this.initialized);
    if (this.initialized) return;
    
    try {
      // Initialize AudioManager
      console.log('Initializing AudioManager');
      this.initAudioManager();
      
      // Initialize CountdownTimer
      console.log('Initializing CountdownTimer');
      this.initCountdownTimer();
      
      // Initialize InteractiveMap
      console.log('Initializing InteractiveMap');
      this.initInteractiveMap();
      
      this.initialized = true;
      console.log('All components initialized successfully');
      eventBus.emit('app:initialized');
    } catch (error) {
      console.error('Error initializing components:', error);
    }
  }
  
  /**
   * Initialize the IntersectionObserver for section visibility
   */
  initSectionObserver() {
    try {
      console.log('Setting up IntersectionObserver for sections');
      const sections = getElements('section');
      
      if (sections.length === 0) {
        console.warn('No sections found to observe');
        return;
      }
      
      // Set hero section to visible immediately
      const heroSection = getElement('home');
      if (heroSection) {
        heroSection.classList.add('visible');
        heroSection.classList.add('loaded');
        console.log('Hero section made visible');
      }
      
      const observerOptions = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.1 // 10% of the section is visible
      };
      
      const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            console.log(`Section ${entry.target.id || 'unknown'} made visible`);
            observer.unobserve(entry.target); // Stop observing once visible
          }
        });
      }, observerOptions);
      
      // Start observing all sections except the hero
      sections.forEach(section => {
        if (section.id !== 'home') {
          sectionObserver.observe(section);
          console.log(`Now observing section: ${section.id || 'unknown'}`);
        }
      });
      
      console.log('Section observer setup complete');
    } catch (error) {
      console.error('Error setting up section observer:', error);
    }
  }

  /**
   * Initialize animation effects like mud splats
   */
  initAnimationEffects() {
    try {
      console.log('Setting up animation effects');
      
      // Set up mobile menu toggle
      this.initMobileMenu();
      
      // Add mud splatter to CTA buttons
      const ctaButtons = getElements('.cta-button');
      console.log('Setting up mud splats for', ctaButtons.length, 'CTA buttons');
      
      addEventListeners(ctaButtons, 'click', (event) => {
        createMudSplat(event.currentTarget);
        if (this.components.audioManager) {
          this.components.audioManager.playClickSound();
        }
      });
      
      // Add mud splatter to desktop nav links
      const desktopNavLinks = getElements('nav#main-nav a');
      console.log('Setting up mud splats for', desktopNavLinks.length, 'nav links');
      
      addEventListeners(desktopNavLinks, 'click', (event) => {
        const href = event.currentTarget.getAttribute('href');
        
        // Only trigger mud splatter for internal anchor links
        if (href && href.startsWith('#')) {
          if (window.innerWidth <= 768 && this.isMenuOpen) {
            // For mobile menu, create a viewport-wide splat
            createViewportWideMudSplat(true);
          } else if (window.innerWidth > 768) {
            // For desktop, create individual splat
            createMudSplat(event.currentTarget);
          }
          
          if (this.components.audioManager) {
            this.components.audioManager.playClickSound();
          }
          
          // Tactile feedback if available
          if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([10, 30, 10]);
          }
        }
      });
      
      console.log('Animation effects setup complete');
    } catch (error) {
      console.error('Error setting up animation effects:', error);
    }
  }
  
  /**
   * Initialize mobile menu toggle
   */
  initMobileMenu() {
    try {
      const menuToggle = getElement('menu-toggle');
      const mainNav = getElement('main-nav');
      
      if (menuToggle && mainNav) {
        console.log('Setting up mobile menu toggle');
        
        // State management with animation protection
        this.isMenuOpen = false;
        let isAnimating = false;
        
        // Open menu with animation support
        this.openMenu = () => {
          if (isAnimating || this.isMenuOpen) return;
          
          isAnimating = true;
          this.isMenuOpen = true;
          
          // Add classes first for visibility
          mainNav.classList.add('open');
          menuToggle.classList.add('open');
          menuToggle.setAttribute('aria-expanded', 'true');
          
          // Force menu visibility with inline styles
          mainNav.style.display = 'block';
          mainNav.style.visibility = 'visible';
          mainNav.style.opacity = '1';
          mainNav.style.height = 'auto';
          
          // Clear animation state after transition completes
          setTimeout(() => {
            isAnimating = false;
          }, 300);
        };
        
        // Close menu with animation support
        this.closeMenu = () => {
          if (isAnimating || !this.isMenuOpen) return;
          
          isAnimating = true;
          this.isMenuOpen = false;
          
          mainNav.classList.remove('open');
          menuToggle.classList.remove('open');
          menuToggle.setAttribute('aria-expanded', 'false');
          
          // Remove forced inline styles
          mainNav.style.display = '';
          mainNav.style.visibility = '';
          mainNav.style.opacity = '';
          mainNav.style.height = '';
          
          // Clear animation state after transition completes
          setTimeout(() => {
            isAnimating = false;
          }, 300);
        };
        
        // Toggle menu with proper event handling
        const handleMenuToggleClick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (this.isMenuOpen) {
            this.closeMenu();
          } else {
            this.openMenu();
          }
        };
        
        menuToggle.addEventListener('click', handleMenuToggleClick);
        
        // Prevent clicks inside menu from closing it
        mainNav.addEventListener('click', (e) => {
          if (e.target.tagName !== 'A') {
            e.stopPropagation();
          }
        });
        
        // Close on outside clicks
        document.addEventListener('click', (e) => {
          if (this.isMenuOpen && 
              !isAnimating && 
              !mainNav.contains(e.target) && 
              !menuToggle.contains(e.target)) {
            this.closeMenu();
          }
        });
        
        // Set up menu links with advanced animations for mobile
        const menuLinks = mainNav.querySelectorAll('a[href^="#"]');
        menuLinks.forEach(link => {
          link.addEventListener('click', (e) => {
            // Only add special handling on mobile
            if (window.innerWidth <= 768) {
              e.preventDefault();
              e.stopPropagation();
              
              const href = link.getAttribute('href');
              
              // Create viewport-wide mud splat on mobile
              try {
                // Check which animation method is available
                if (typeof window.createViewportWideMudSplat === 'function') {
                  window.createViewportWideMudSplat(true);
                } 
                else if (typeof window.createParticlesDirectly === 'function') {
                  window.createParticlesDirectly(true);
                }
                else {
                  // Try local variable as last resort
                  createViewportWideMudSplat(true);
                }
              } catch (error) {
                console.error('Animation error:', error);
              }
              
              // Play click sound
              if (this.components.audioManager) {
                this.components.audioManager.playClickSound();
              }
              
              // Close menu with a delay to let animation play
              setTimeout(() => {
                this.closeMenu();
              }, 300);
              
              // Navigate after delay to show animation
              setTimeout(() => {
                window.location.hash = href;
              }, 800);
            }
          });
        });
      }
    } catch (error) {
      console.error('Error setting up mobile menu:', error);
    }
  }
  
  /**
   * Initialize AudioManager component
   */
  initAudioManager() {
    const elements = {
      clickSound: getElement('click-sound'),
      soundToggle: getElement('sound-toggle'),
      soundIcon: getElement('sound-icon')
    };
    
    console.log('AudioManager elements:', elements);
    this.components.audioManager = new AudioManager({
      elements,
      enabled: true,
      playbackProbability: 0.4
    });
  }
  
  /**
   * Initialize CountdownTimer component
   */
  initCountdownTimer() {
    const elements = {
      days: getElement('countdown-days'),
      hours: getElement('countdown-hours'),
      minutes: getElement('countdown-minutes'),
      seconds: getElement('countdown-seconds'),
      secondsParent: getElement('countdown-seconds')?.parentElement
    };
    
    console.log('CountdownTimer elements:', elements);
    if (elements.days && elements.hours && elements.minutes && elements.seconds) {
      this.components.countdownTimer = new CountdownTimer(
        'September 21, 2025 08:00:00',
        elements
      );
      
      this.components.countdownTimer.start();
      console.log('CountdownTimer started');
    } else {
      console.warn('CountdownTimer elements not found');
    }
  }
  
  /**
   * Initialize InteractiveMap component
   */
  initInteractiveMap() {
    try {
      this.components.interactiveMap = InteractiveMap.createFromSelectors();
      console.log('InteractiveMap created');
    } catch (error) {
      console.error('Error creating InteractiveMap:', error);
    }
  }
  
  /**
   * Initialize smooth scrolling for anchor links
   */
  initSmoothScrolling() {
    try {
      const anchorLinks = getElements('a[href^="#"]');
      console.log('Setting up smooth scrolling for', anchorLinks.length, 'anchor links');
      
      addEventListeners(anchorLinks, 'click', function(e) {
        e.preventDefault();
        const targetElement = document.querySelector(this.getAttribute('href'));
        if (targetElement) {
          // Calculate offset due to sticky header
          const headerOffset = window.innerWidth <= 768 ? 60 : 100; // Adjust for mobile vs desktop
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          // If mobile menu is open, close it with a delay
          const mainNav = document.getElementById('main-nav');
          const menuToggle = document.getElementById('menu-toggle');
          
          if (window.innerWidth <= 768 && mainNav && mainNav.classList.contains('open')) {
            setTimeout(() => {
              if (menuToggle) {
                menuToggle.classList.remove('open');
                menuToggle.setAttribute('aria-expanded', 'false');
              }
              mainNav.classList.remove('open');
            }, 500);
          }

          // Scroll after a slight delay if using splatter effect
          setTimeout(() => {
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }, window.innerWidth <= 768 ? 510 : 0);
        }
      });
    } catch (error) {
      console.error('Error setting up smooth scrolling:', error);
    }
  }
}

// Create and export a singleton instance
const app = new App();

// Auto-initialize if loaded as a module
console.log('Auto-initializing app');
app.init();

// Export app globally for debugging
window.app = app;

export default app; 