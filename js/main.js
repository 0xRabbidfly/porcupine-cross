/**
 * Main Application
 * Orchestrates all components and handles initialization
 */

import AudioManager from './components/audioManager.js';
import CountdownTimer from './components/countdownTimer.js';
import InteractiveMap from './components/interactiveMap.js';
import eventBus from './core/eventBus.js';
import { getElements, getElement, addEventListeners } from './utils/domUtils.js';

// Application class
class App {
  constructor() {
    this.components = {};
    this.initialized = false;
  }
  
  /**
   * Initialize the application
   */
  init() {
    // Wait for DOM content to be loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initComponents());
    } else {
      this.initComponents();
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
    
    // Initialize AudioManager
    this.initAudioManager();
    
    // Initialize CountdownTimer
    this.initCountdownTimer();
    
    // Initialize InteractiveMap
    this.initInteractiveMap();
    
    this.initialized = true;
    eventBus.emit('app:initialized');
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
    
    if (elements.days && elements.hours && elements.minutes && elements.seconds) {
      this.components.countdownTimer = new CountdownTimer(
        'September 21, 2025 08:00:00',
        elements
      );
      
      this.components.countdownTimer.start();
    }
  }
  
  /**
   * Initialize InteractiveMap component
   */
  initInteractiveMap() {
    this.components.interactiveMap = InteractiveMap.createFromSelectors();
  }
  
  /**
   * Initialize smooth scrolling for anchor links
   */
  initSmoothScrolling() {
    const anchorLinks = getElements('a[href^="#"]');
    
    addEventListeners(anchorLinks, 'click', function(e) {
      e.preventDefault();
      const targetElement = document.querySelector(this.getAttribute('href'));
      if (targetElement) {
        // Calculate offset due to sticky header
        const headerOffset = 100; // Match this with body padding-top
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  }
}

// Create and export a singleton instance
const app = new App();

// Auto-initialize if loaded as a module
app.init();

export default app; 