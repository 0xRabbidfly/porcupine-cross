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
import { setupAudioPlayButton } from './utils/audioUtils.js';

// Application class
class App {
  constructor() {
    this.components = {};
    this.initialized = false;
    this.isMenuOpen = false;
  }

  /**
   * Initialize the application
   */
  init() {
    // Wait for DOM content to be loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initComponents();
        this.initSectionObserver();
        this.initAnimationEffects();
      });
    } else {
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
    if (this.initialized) return;

    try {
      // Initialize AudioManager
      this.initAudioManager();

      // Initialize CountdownTimer
      this.initCountdownTimer();

      // Initialize InteractiveMap
      this.initInteractiveMap();

      // Initialize Hero Animation
      this.initHeroAnimation();

      this.initialized = true;
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
      const sections = getElements('section');

      if (sections.length === 0) {
        return;
      }

      // Set hero section to visible immediately
      const heroSection = getElement('home');
      if (heroSection) {
        heroSection.classList.add('visible');
        heroSection.classList.add('loaded');
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
        }
      });

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
      // Set up mobile menu toggle
      this.initMobileMenu();

      // Add mud splatter to CTA buttons
      const ctaButtons = getElements('.cta-button');

      addEventListeners(ctaButtons, 'click', event => {
        AnimationSystem.createMudSplat(event.currentTarget);
        if (this.components.audioManager) {
          this.components.audioManager.playClickSound();
        }
      });

      // Add mud splatter to desktop nav links
      const desktopNavLinks = getElements('nav#main-nav a');

      addEventListeners(desktopNavLinks, 'click', event => {
        // Prevent double-firing if handled by mobile menu
        if (window.innerWidth <= 768 && this.components.mobileMenu?.menu?.contains(event.target)) {
          return;
        }
        // Always trigger mud splat for nav links
        if (window.innerWidth <= 768 && this.components.mobileMenu?.getState().isOpen) {
          // For mobile menu, create a viewport-wide splat
          AnimationSystem.createViewportSplat({ mobile: true });
        } else if (window.innerWidth > 768) {
          // For desktop, create individual splat
          AnimationSystem.createMudSplat(event.currentTarget);
        }

        if (this.components.audioManager) {
          this.components.audioManager.primeAudio();
          this.components.audioManager.playClickSound();
        }

        // Tactile feedback if available
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate([10, 30, 10]);
        }
      });

      // Initialize experimental animations
      setTimeout(() => {
        this.initFlippingTitle();
        this.initOrbitingIcons();

        // Ensure hero section is marked as loaded for animations
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
          heroSection.classList.add('loaded');
          console.log('Hero section marked as loaded for animations');
        }
      }, 500);
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

    this.components.audioManager = new AudioManager({
      elements,
      enabled: true, // Start with sound enabled but control still hidden
      playbackProbability: 0.3, // 30% chance of playing sound when enabled
      playThrottleMs: 1000, // 1 second between sounds
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
      secondsParent: getElement('countdown-seconds')?.parentElement,
    };

    if (elements.days && elements.hours && elements.minutes && elements.seconds) {
      this.components.countdownTimer = new CountdownTimer('September 21, 2025 08:00:00', elements, {
        animationClasses: {
          pulse: 'pulse',
          tick: 'tick',
        },
      });

      this.components.countdownTimer.start();
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

      if (heroSection) {
        // Use AnimationSystem to fade in the hero section
        AnimationSystem.animate(heroSection, 'fade-in', {
          duration: 500,
          variables: { '--hero-opacity': '1' },
        });
      }
    } catch (error) {
      console.error('Error setting up hero animation:', error);
    }
  }

  /**
   * Initialize flipping title animation for PROLOGUE
   */
  initFlippingTitle() {
    const titleElement = document.querySelector('.prologue-card-title');
    if (!titleElement) {
      console.log('Prologue title element not found');
      return;
    }

    const titleText = titleElement.textContent.trim();
    console.log('Found title text:', titleText);
    titleElement.innerHTML = '';

    // Available suits and their colors
    const suits = [
      { symbol: '♠', color: '#000000' }, // Spade - black
      { symbol: '♣', color: '#000000' }, // Club - black
      { symbol: '♥', color: '#e73e3a' }, // Heart - red
      { symbol: '♦', color: '#e73e3a' }, // Diamond - red
    ];

    // Create flipping letter structure
    titleText.split('').forEach((letter, index) => {
      if (letter === ' ') {
        titleElement.appendChild(document.createTextNode(' '));
        return;
      }

      // Pick a random suit for this letter
      const randomSuit = suits[Math.floor(Math.random() * suits.length)];

      const letterContainer = document.createElement('span');
      letterContainer.className = 'flip-letter';

      const letterFront = document.createElement('span');
      letterFront.className = 'letter-front';
      letterFront.textContent = letter;

      const letterBack = document.createElement('span');
      letterBack.className = 'letter-back';
      letterBack.textContent = randomSuit.symbol;
      letterBack.style.color = randomSuit.color;

      letterContainer.appendChild(letterFront);
      letterContainer.appendChild(letterBack);
      titleElement.appendChild(letterContainer);
    });

    console.log('Flipping letters initialized with random suits and colors');
  }

  /**
   * Initialize orbiting suit icons around hero copy
   */
  initOrbitingIcons() {
    const heroSection = document.querySelector('.hero');
    const heroCopySide = document.querySelector('.hero-copy-side');

    if (!heroSection || !heroCopySide) {
      console.log('Hero section or copy side not found for orbiting icons');
      return;
    }

    // Available suits and their colors
    const suits = [
      { symbol: '♠', color: '#000000' }, // Spade - black
      { symbol: '♣', color: '#000000' }, // Club - black
      { symbol: '♥', color: '#e73e3a' }, // Heart - red
      { symbol: '♦', color: '#e73e3a' }, // Diamond - red
    ];

    // Set random suits and colors for the orbiting icons
    const randomSuit1 = suits[Math.floor(Math.random() * suits.length)];
    const randomSuit2 = suits[Math.floor(Math.random() * suits.length)];

    // Apply the random suits via CSS custom properties
    heroCopySide.style.setProperty('--orbit-suit-1', `"${randomSuit1.symbol}"`);
    heroCopySide.style.setProperty('--orbit-color-1', randomSuit1.color);
    heroCopySide.style.setProperty('--orbit-suit-2', `"${randomSuit2.symbol}"`);
    heroCopySide.style.setProperty('--orbit-color-2', randomSuit2.color);

    console.log(
      'Orbiting icons initialized with random suits:',
      randomSuit1.symbol,
      randomSuit2.symbol
    );
  }
}

let app = null;
try {
  // Create and export a singleton instance
  app = new App();
  app.init();
} catch (error) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'app-error-boundary';
  errorDiv.innerHTML = '<h2>Something went wrong</h2><p>' + (error.message || error) + '</p>';
  errorDiv.style =
    'background: #fff3f3; color: #b71c1c; padding: 2em; margin: 2em auto; border-radius: 8px; max-width: 600px; text-align: center; font-size: 1.2em;';
  document.body.prepend(errorDiv);
  console.error('App initialization error:', error);
}
window.app = app;
export default app;

document.addEventListener('DOMContentLoaded', setupAudioPlayButton);
