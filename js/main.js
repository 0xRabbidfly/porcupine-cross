/**
 * Main Application
 * Orchestrates all components and handles initialization
 */

/* global IntersectionObserver */

import AudioManager from './components/audioManager.js';
import { CountdownTimer } from './components/countdownTimer.js';
import InteractiveMap from './components/interactiveMap.js';
import MobileMenu from './components/mobileMenu.js';
import eventBus from './core/eventBus.js';
import { getElements, getElement, addEventListeners } from './utils/domUtils.js';
import AnimationSystem from './core/animationSystem.js';

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

      // Initialize Hero Animation
      console.log('Initializing Hero Animation');
      this.initHeroAnimation();

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
        threshold: 0.1, // 10% of the section is visible
      };

      const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            console.log(`Section ${entry.target.id || 'unknown'} made visible`);

            // Optional: stop observing once animated to improve performance
            observer.unobserve(entry.target);

            // Emit event for section visibility
            eventBus.emit('section:visible', {
              id: entry.target.id,
              element: entry.target,
            });
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

      // Keep a reference to the observer to prevent garbage collection
      this.components.sectionObserver = sectionObserver;
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

      addEventListeners(ctaButtons, 'click', event => {
        AnimationSystem.createMudSplat(event.currentTarget);
        if (this.components.audioManager) {
          this.components.audioManager.playClickSound();
        }
      });

      // Add mud splatter to desktop nav links
      const desktopNavLinks = getElements('nav#main-nav a');
      console.log('Setting up mud splats for', desktopNavLinks.length, 'nav links');

      addEventListeners(desktopNavLinks, 'click', event => {
        // Always trigger mud splat for nav links
        if (window.innerWidth <= 768 && this.components.mobileMenu?.getState().isOpen) {
          // For mobile menu, create a viewport-wide splat
          AnimationSystem.createViewportSplat({ mobile: true });
        } else if (window.innerWidth > 768) {
          // For desktop, create individual splat
          AnimationSystem.createMudSplat(event.currentTarget);
        }

        if (this.components.audioManager) {
          this.components.audioManager.playClickSound();
        }

        // Tactile feedback if available
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate([10, 30, 10]);
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
      // Create MobileMenu component instance
      this.components.mobileMenu = new MobileMenu({
        menuSelector: '#main-nav',
        toggleSelector: '#menu-toggle',
        openClass: 'open',
        transitionDuration: 500,
        animationStyle: 'default', // Initialize with default animation style
      });

      // Subscribe to mobile menu events for app-level coordination
      eventBus.on('mobileMenu:opened', () => {
        this.isMenuOpen = true;
      });

      eventBus.on('mobileMenu:closed', () => {
        this.isMenuOpen = false;
      });

      // Create animation style switcher (visible only in development)
      this.createMenuStyleSwitcher();

      console.log('Mobile menu component initialized');
    } catch (error) {
      console.error('Error setting up mobile menu:', error);
    }
  }

  /**
   * Create a menu animation style switcher
   * This is a development tool only visible when adding ?dev=true to the URL
   */
  createMenuStyleSwitcher() {
    try {
      // Only show in development mode
      if (!window.location.search.includes('dev=true')) {
        return;
      }

      // Create the style switcher container
      const styleSwitcher = document.createElement('div');
      styleSwitcher.className = 'menu-style-switcher';
      styleSwitcher.innerHTML = `
        <div class="style-switcher-label">Menu Animation:</div>
        <div class="style-switcher-options">
          <button data-style="default" class="active">Default</button>
          <button data-style="flip">Flip</button>
          <button data-style="slide">Slide</button>
        </div>
      `;

      // Add styles for the switcher
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .menu-style-switcher {
          position: fixed;
          bottom: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 8px;
          font-size: 12px;
          z-index: 9999;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
        }
        .style-switcher-label {
          margin-bottom: 5px;
          font-weight: bold;
          font-size: 11px;
        }
        .style-switcher-options {
          display: flex;
          gap: 5px;
        }
        .style-switcher-options button {
          border: 1px solid #ccc;
          background: #f5f5f5;
          border-radius: 3px;
          padding: 4px 8px;
          font-size: 11px;
          cursor: pointer;
        }
        .style-switcher-options button.active {
          background: #e73e3a;
          color: white;
          border-color: #e73e3a;
        }
        .style-switcher-options button:hover:not(.active) {
          background: #eee;
        }
      `;

      // Add event listeners to buttons
      styleSwitcher.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
          // Update active button
          styleSwitcher.querySelectorAll('button').forEach(btn => {
            btn.classList.remove('active');
          });
          button.classList.add('active');

          // Set animation style
          const style = button.getAttribute('data-style');
          this.components.mobileMenu.setAnimationStyle(style);

          // Show a notification to test the menu
          this.showTestNotification('Animation style changed! Open menu to test.');
        });
      });

      // Append the elements to the body
      document.head.appendChild(styleElement);
      document.body.appendChild(styleSwitcher);

      console.log('Menu style switcher created (development only)');
    } catch (error) {
      console.error('Error creating menu style switcher:', error);
    }
  }

  /**
   * Show a temporary notification
   * @param {string} message - Message to display
   */
  showTestNotification(message) {
    try {
      // Remove existing notification if any
      const existingNotification = document.querySelector('.test-notification');
      if (existingNotification) {
        existingNotification.remove();
      }

      // Create notification element
      const notification = document.createElement('div');
      notification.className = 'test-notification';
      notification.textContent = message;

      // Add styles
      const styleElement = document.createElement('style');
      if (!document.querySelector('style[data-for="notification"]')) {
        styleElement.setAttribute('data-for', 'notification');
        styleElement.textContent = `
          .test-notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            font-size: 14px;
            animation: notification-fade 3s forwards;
          }
          @keyframes notification-fade {
            0% { opacity: 0; transform: translate(-50%, -20px); }
            10% { opacity: 1; transform: translate(-50%, 0); }
            90% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, -20px); }
          }
        `;
        document.head.appendChild(styleElement);
      }

      // Add to DOM and remove after animation
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 3000);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Initialize AudioManager component
   */
  initAudioManager() {
    const elements = {
      clickSound: getElement('click-sound'),
      soundToggle: getElement('sound-toggle'),
      soundIcon: getElement('sound-icon'),
    };

    console.log('AudioManager elements:', elements);
    this.components.audioManager = new AudioManager({
      elements,
      enabled: true, // Start with sound enabled but control still hidden
      playbackProbability: 0.3, // 30% chance of playing sound when enabled
    });

    // Log initialization status
    console.log(
      'AudioManager initialized with probability:',
      this.components.audioManager.getPlaybackProbability()
    );
    console.log('AudioManager sound enabled:', this.components.audioManager.isSoundEnabled());
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
      secondsParent: getElement('countdown-seconds')?.parentElement,
    };

    console.log('CountdownTimer elements:', elements);
    if (elements.days && elements.hours && elements.minutes && elements.seconds) {
      this.components.countdownTimer = new CountdownTimer('September 21, 2025 08:00:00', elements, {
        animationClasses: {
          pulse: 'pulse',
          tick: 'tick',
        },
      });

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

      addEventListeners(anchorLinks, 'click', e => {
        e.preventDefault();
        const targetElement = document.querySelector(e.currentTarget.getAttribute('href'));
        if (targetElement) {
          // Calculate offset due to sticky header
          const headerOffset = window.innerWidth <= 768 ? 60 : 100; // Adjust for mobile vs desktop
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          // If mobile menu is open, close it with a delay
          if (window.innerWidth <= 768 && this.components.mobileMenu?.getState().isOpen) {
            setTimeout(() => {
              this.components.mobileMenu.closeMenu();
            }, 200);

            // Scroll after a slight delay to allow animation to complete
            setTimeout(() => {
              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
              });
            }, 1000);
          } else {
            // Desktop or menu already closed - scroll immediately
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth',
            });
          }
        }
      });
    } catch (error) {
      console.error('Error setting up smooth scrolling:', error);
    }
  }

  /**
   * Initialize hero section animation
   */
  initHeroAnimation() {
    try {
      const heroSection = getElement('home');
      console.log('Setting up hero animation for', heroSection ? '#home' : 'none found');

      if (heroSection) {
        // Use AnimationSystem to fade in the hero section
        AnimationSystem.animate(heroSection, 'fade-in', {
          duration: 500,
          variables: { '--hero-opacity': '1' },
        });

        console.log('Hero section animation applied');
      }
    } catch (error) {
      console.error('Error setting up hero animation:', error);
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
