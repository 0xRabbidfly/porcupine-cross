/**
 * Main Application
 * Orchestrates all components and handles initialization
 */

import AudioManager from './components/audioManager.js';
import InteractiveMap from './components/interactiveMap.js';
import MobileMenu from './components/mobileMenu.js';
import SmolderchadEasterEgg from './components/smolderchadEasterEgg.js';
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

      // Initialize SMOLDERCHAD Easter Egg
      this.initSmolderchadEasterEgg();

      // Track easter egg interactions in GA4
      if (window.gtag) {
        // Track spade logo clicks
        const spadeLogo = document.querySelector('.surface-logo');
        if (spadeLogo) {
          spadeLogo.addEventListener('click', () => {
            window.gtag('event', 'EasterEgg', {
              event_category: 'engagement',
              event_label: 'spade_logo_click',
              value: 1,
            });
          });
        }

        // Track "WTF" typing
        document.addEventListener('keydown', event => {
          if (event.key === 't' || event.key === 'T') {
            // Simple "WTF" detection - you might want to enhance this
            const currentText = document.activeElement?.value || '';
            if (currentText.toLowerCase().includes('wtf')) {
              window.gtag('event', 'EasterEgg', {
                event_category: 'engagement',
                event_label: 'wtf_typed',
                value: 1,
              });
            }
          }
        });
      }

      // Track audio file clicks in GA4
      if (window.gtag) {
        const audioFile = document.querySelector('audio[src*="crosstoberfest.mp3"]');
        if (audioFile) {
          audioFile.addEventListener('play', () => {
            window.gtag('event', 'RaceOutline', {
              event_category: 'engagement',
              event_label: 'audio_played',
              value: 1,
            });
          });
        }
      }

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

      // Add mud splatter to registration buttons
      const heroRegisterButton = getElements('.hero-register-button');
      const registerButton = getElements('.register-button');
      const registerButtons = [...heroRegisterButton, ...registerButton].filter(Boolean);

      addEventListeners(registerButtons, 'click', event => {
        AnimationSystem.createMudSplat(event.currentTarget);
        if (this.components.audioManager) {
          this.components.audioManager.playClickSound();
        }

        // Track registration button clicks in GA4
        if (window.gtag) {
          window.gtag('event', 'register_button_click', {
            event_category: 'engagement',
            event_label: 'registration',
            value: 1,
          });
        }
      });

      // Add mud splatter to contact section links
      const contactLinks = getElements('#contact a');

      addEventListeners(contactLinks, 'click', event => {
        AnimationSystem.createMudSplat(event.currentTarget);
        if (this.components.audioManager) {
          this.components.audioManager.playClickSound();
        }

        // Track contact link clicks in GA4 with descriptive names
        if (window.gtag) {
          const linkText = event.currentTarget.textContent.toLowerCase();
          let eventName = 'contact_link_click';

          // Use more specific event names based on link content
          if (linkText.includes('instagram')) {
            eventName = 'instagram_click';
          } else if (linkText.includes('facebook')) {
            eventName = 'facebook_click';
          } else if (linkText.includes('strava')) {
            eventName = 'strava_click';
          } else if (linkText.includes('email') || linkText.includes('@')) {
            eventName = 'email_click';
          } else if (linkText.includes('map') || linkText.includes('location')) {
            eventName = 'location_click';
          }

          window.gtag('event', eventName, {
            event_category: 'engagement',
            event_label: 'contact',
            value: 1,
          });
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
          console.info('Hero section marked as loaded for animations');
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
    // Only initialize if countdown elements exist
    const countdownContainer = document.querySelector('.countdown-container, .countdown-timer');
    if (!countdownContainer) {
      return; // Exit early if no countdown container found
    }

    // Get all countdown elements (both desktop and mobile)
    const allDaysElements = document.querySelectorAll('#countdown-days');
    const allHoursElements = document.querySelectorAll('#countdown-hours');
    const allMinutesElements = document.querySelectorAll('#countdown-minutes');
    const allSecondsElements = document.querySelectorAll('#countdown-seconds');

    if (
      allDaysElements.length > 0 &&
      allHoursElements.length > 0 &&
      allMinutesElements.length > 0 &&
      allSecondsElements.length > 0
    ) {
      // Create a custom update function that updates all elements
      const customUpdate = () => {
        const now = new Date().getTime();
        const targetDate = new Date('September 21, 2025 08:00:00').getTime();
        const distance = targetDate - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Update all day elements
        allDaysElements.forEach(element => {
          element.textContent = days.toString().padStart(2, '0');
        });

        // Update all hour elements
        allHoursElements.forEach(element => {
          element.textContent = hours.toString().padStart(2, '0');
        });

        // Update all minute elements
        allMinutesElements.forEach(element => {
          element.textContent = minutes.toString().padStart(2, '0');
        });

        // Update all second elements
        allSecondsElements.forEach(element => {
          element.textContent = seconds.toString().padStart(2, '0');
        });

        return { days, hours, minutes, seconds, distance };
      };

      // Start the countdown with custom update function
      this.components.countdownTimer = {
        start: () => {
          customUpdate(); // Initial update
          this.countdownInterval = setInterval(customUpdate, 1000);
        },
        stop: () => {
          if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
          }
        },
      };

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
      // Only initialize if the required map elements exist
      const mapContainer = document.querySelector('.interactive-map-container');
      if (mapContainer) {
        this.components.interactiveMap = InteractiveMap.createFromSelectors();
      }
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
      // Only initialize if hero section exists
      const heroSection = getElement('home');
      if (!heroSection) {
        return; // Exit early if no hero section found
      }

      // Use AnimationSystem to fade in the hero section
      AnimationSystem.animate(heroSection, 'fade-in', {
        duration: 500,
        variables: { '--hero-opacity': '1' },
      });
    } catch (error) {
      console.error('Error setting up hero animation:', error);
    }
  }

  /**
   * Initialize SMOLDERCHAD Easter Egg
   */
  initSmolderchadEasterEgg() {
    try {
      this.components.smolderchadEasterEgg = new SmolderchadEasterEgg();
    } catch (error) {
      console.error('Error setting up SMOLDERCHAD Easter Egg:', error);
    }
  }

  /**
   * Initialize flipping title animation for PROLOGUE
   */
  initFlippingTitle() {
    const titleElements = document.querySelectorAll('.prologue-card-title');
    if (titleElements.length === 0) {
      console.info('Prologue title elements not found');
      return;
    }

    // Process all title elements (desktop and mobile)
    titleElements.forEach((titleElement, index) => {
      console.info(`Processing title element ${index + 1}:`, titleElement);

      const titleText = titleElement.textContent.trim();
      console.info('Found title text:', titleText);
      titleElement.innerHTML = '';

      // Available suits and their colors
      const suits = [
        { symbol: '♠', color: '#000000' }, // Spade - black
        { symbol: '♣', color: '#000000' }, // Club - black
        { symbol: '♥', color: '#e73e3a' }, // Heart - red
        { symbol: '♦', color: '#e73e3a' }, // Diamond - red
      ];

      // Create flipping letter structure
      titleText.split('').forEach((letter, _index) => {
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

      console.info(
        `Flipping letters initialized for element ${index + 1} with random suits and colors`
      );
    });
  }

  /**
   * Initialize back-and-forth suit icon under hero copy
   */
  initOrbitingIcons() {
    const heroSection = document.querySelector('.hero');
    const heroCopySide = document.querySelector('.hero-copy-side');

    if (!heroSection || !heroCopySide) {
      console.info('Hero section or copy side not found for back-and-forth icon');
      return;
    }

    // Available suits and their colors
    const suits = [
      { symbol: '♠', color: '#000000' }, // Spade - black
      { symbol: '♣', color: '#000000' }, // Club - black
      { symbol: '♥', color: '#e73e3a' }, // Heart - red
      { symbol: '♦', color: '#e73e3a' }, // Diamond - red
    ];

    // Set random suit and color for the back-and-forth icon
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];

    // Apply the random suit via CSS custom properties
    heroCopySide.style.setProperty('--back-forth-suit', `"${randomSuit.symbol}"`);
    heroCopySide.style.setProperty('--back-forth-color', randomSuit.color);

    // Calculate the dynamic text width for the animation
    this.calculateTextAnimationWidth();

    // Set up resize observer to recalculate on window resize
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        this.calculateTextAnimationWidth();
      });
      resizeObserver.observe(heroCopySide);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', () => {
        this.calculateTextAnimationWidth();
      });
    }

    console.info('Back-and-forth icon initialized with random suit:', randomSuit.symbol);
  }

  /**
   * Calculate the dynamic text width for the back-and-forth animation
   */
  calculateTextAnimationWidth() {
    const heroCopySide = document.querySelector('.hero-copy-side');
    const textContent = heroCopySide.querySelector('p');

    if (!heroCopySide || !textContent) {
      console.info('Hero copy side or text content not found for width calculation');
      return;
    }

    // Get the actual text content width
    const textWidth = textContent.getBoundingClientRect().width;

    // Determine icon width based on screen size (mobile vs desktop)
    const isMobile = window.innerWidth <= 768;
    const iconWidth = isMobile ? 19.2 : 24; // 1.2rem (mobile) or 1.5rem (desktop) in pixels

    // Calculate the maximum travel distance (text width minus icon width)
    const maxTravel = Math.max(0, textWidth - iconWidth);

    // Set the calculated width as a CSS custom property
    heroCopySide.style.setProperty('--text-animation-width', `${maxTravel}px`);

    console.info(
      `Text animation width calculated: ${textWidth}px text, ${maxTravel}px travel (${isMobile ? 'mobile' : 'desktop'})`
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
