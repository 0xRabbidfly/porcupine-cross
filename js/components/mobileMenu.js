/**
 * Mobile Menu Component
 *
 * Implements proper state management and CSS transitions
 * for the mobile menu. Uses transitionend events instead of timeouts.
 */

import eventBus from '../core/eventBus.js';

class MobileMenu {
  /**
   * Create a mobile menu instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Default options
    this.options = {
      menuSelector: '#main-nav',
      toggleSelector: '#menu-toggle',
      openClass: 'open',
      transitionDuration: 300,
      animationStyle: 'default', // default, flip, slide
      ...options,
    };

    // State
    this.state = {
      isOpen: false,
      isAnimating: false,
      currentAnimationStyle: this.options.animationStyle,
    };

    // DOM elements
    this.menu = document.querySelector(this.options.menuSelector);
    this.toggle = document.querySelector(this.options.toggleSelector);

    if (!this.menu || !this.toggle) {
      console.error('Mobile menu elements not found');
      return;
    }

    // Initialize
    this.init();
  }

  /**
   * Initialize the mobile menu
   */
  init() {
    // Toggle menu on click
    this.toggle.addEventListener('click', this.handleToggleClick.bind(this));

    // Store bound handlers for removal in destroy
    this._boundDocumentClickHandler = this.handleDocumentClick.bind(this);
    this._boundTransitionEndHandler = this.handleTransitionEnd.bind(this);

    // Close menu on outside click
    document.addEventListener('click', this._boundDocumentClickHandler);

    // Listen for transition end
    this.menu.addEventListener('transitionend', this._boundTransitionEndHandler);

    // Set initial ARIA attributes
    this.toggle.setAttribute('aria-expanded', 'false');

    // Add body class for CSS targeting
    document.body.classList.add('mobile-menu-enabled');

    // Setup menu links
    this.setupMenuLinks();

    console.log('Mobile menu initialized');
  }

  /**
   * Set up click handlers for menu links
   */
  setupMenuLinks() {
    const menuLinks = this.menu.querySelectorAll('a[href^="#"]');

    menuLinks.forEach(link => {
      link.addEventListener('click', this.handleLinkClick.bind(this));
    });
  }

  /**
   * Handle toggle button click
   * @param {Event} event - The click event
   */
  handleToggleClick(event) {
    // This is a critical fix for the open/close issue
    // We need to stop event propagation to prevent the document click
    // handler from immediately closing the menu after opening
    event.preventDefault();
    event.stopPropagation();

    // Delay menu toggle slightly to ensure event propagation is properly handled
    setTimeout(() => {
      this.toggleMenu();
    }, 10);
  }

  /**
   * Handle document click to close menu when clicking outside
   * @param {Event} event - The click event
   */
  handleDocumentClick(event) {
    // Only process if not clicking on the toggle button (which has its own handler)
    if (this.toggle.contains(event.target)) {
      return;
    }

    if (this.state.isOpen && !this.state.isAnimating && !this.menu.contains(event.target)) {
      this.closeMenu();
    }
  }

  /**
   * Handle link click within the menu
   * @param {Event} event - The click event
   */
  handleLinkClick(event) {
    // Only add special handling on mobile
    if (window.innerWidth <= 768) {
      event.preventDefault();
      event.stopPropagation();

      const href = event.currentTarget.getAttribute('href');

      // Create animation if available
      if (window.AnimationSystem) {
        window.AnimationSystem.createViewportSplat();
      }

      // Play click sound if available
      if (window.app && window.app.components.audioManager) {
        window.app.components.audioManager.playClickSound();
      }

      // Close menu with a delay
      setTimeout(() => {
        this.closeMenu();
      }, 200);

      // Navigate after delay
      setTimeout(() => {
        window.location.hash = href;
      }, 1000);
    }
  }

  /**
   * Handle transition end event
   * @param {Event} event - The transitionend event
   */
  handleTransitionEnd(event) {
    // Only process if it's the menu element transitioning
    if (event && event.target !== this.menu) {
      return;
    }

    console.log(
      'MobileMenu: Transition ended, current state:',
      this.state.isOpen ? 'open' : 'closed',
      'isAnimating:',
      this.state.isAnimating
    );

    this.state.isAnimating = false;

    // Emit completion event based on state
    if (this.state.isOpen) {
      eventBus.emit('mobileMenu:transitionComplete', { isOpen: true });
    } else {
      eventBus.emit('mobileMenu:transitionComplete', { isOpen: false });
    }
  }

  /**
   * Toggle menu open/closed
   */
  toggleMenu() {
    if (this.state.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  /**
   * Open the mobile menu
   */
  openMenu() {
    if (this.state.isAnimating || this.state.isOpen) return;

    this.state.isAnimating = true;
    this.state.isOpen = true;

    this.menu.classList.add(this.options.openClass);
    this.toggle.classList.add(this.options.openClass);
    this.toggle.setAttribute('aria-expanded', 'true');

    // Emit event for menu opened
    eventBus.emit('mobileMenu:opened', { isAnimating: true });

    // Always set a backup timeout to clear animation state
    // This ensures the menu can be interacted with again even if transitionend fails
    this._clearAnimationTimeout();
    this._animationTimeout = setTimeout(() => {
      console.log('MobileMenu: Animation timeout fired (open)');
      if (this.state.isAnimating) {
        this.state.isAnimating = false;
        eventBus.emit('mobileMenu:transitionComplete', { isOpen: true });
      }
    }, this.options.transitionDuration + 50);
  }

  /**
   * Close the mobile menu
   */
  closeMenu() {
    if (this.state.isAnimating || !this.state.isOpen) return;

    this.state.isAnimating = true;
    this.state.isOpen = false;

    this.menu.classList.remove(this.options.openClass);
    this.toggle.classList.remove(this.options.openClass);
    this.toggle.setAttribute('aria-expanded', 'false');

    // Emit event for menu closed
    eventBus.emit('mobileMenu:closed', { isAnimating: true });

    // Always set a backup timeout to clear animation state
    // This ensures the menu can be interacted with again even if transitionend fails
    this._clearAnimationTimeout();
    this._animationTimeout = setTimeout(() => {
      console.log('MobileMenu: Animation timeout fired (close)');
      if (this.state.isAnimating) {
        this.state.isAnimating = false;
        eventBus.emit('mobileMenu:transitionComplete', { isOpen: false });
      }
    }, this.options.transitionDuration + 50);
  }

  /**
   * Clear any existing animation timeout
   * @private
   */
  _clearAnimationTimeout() {
    if (this._animationTimeout) {
      clearTimeout(this._animationTimeout);
      this._animationTimeout = null;
    }
  }

  /**
   * Get current menu state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Reset the menu state (for testing)
   */
  resetState() {
    this.state.isOpen = false;
    this.state.isAnimating = false;

    if (this.menu) {
      this.menu.classList.remove(this.options.openClass);
    }

    if (this.toggle) {
      this.toggle.classList.remove(this.options.openClass);
      this.toggle.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * Force state update (for testing)
   */
  _forceState(newState) {
    if (typeof newState.isOpen !== 'undefined') {
      this.state.isOpen = newState.isOpen;
    }

    if (typeof newState.isAnimating !== 'undefined') {
      this.state.isAnimating = newState.isAnimating;
    }
  }

  /**
   * Clean up event listeners and timeouts
   */
  destroy() {
    // Clean up event listeners
    if (this.toggle) {
      this.toggle.removeEventListener('click', this.handleToggleClick);
    }

    if (this._boundDocumentClickHandler) {
      document.removeEventListener('click', this._boundDocumentClickHandler);
    }

    if (this.menu && this._boundTransitionEndHandler) {
      this.menu.removeEventListener('transitionend', this._boundTransitionEndHandler);
    }

    // Remove body class
    document.body.classList.remove('mobile-menu-enabled');

    // Clear any pending timeouts
    this._clearAnimationTimeout();

    console.log('Mobile menu destroyed');
  }

  /**
   * Set animation style for the menu
   * @param {string} style - Animation style ('default', 'flip', 'slide')
   */
  setAnimationStyle(style) {
    // Remove previous animation classes
    document.body.classList.remove('animation-flip', 'animation-slide');

    // Store the current animation style
    this.state.currentAnimationStyle = style;

    // Apply the new animation class if not default
    if (style === 'flip') {
      document.body.classList.add('animation-flip');
    } else if (style === 'slide') {
      document.body.classList.add('animation-slide');
    }

    // Log the change
    console.log(`Menu animation style changed to: ${style}`);

    // Emit event for the animation style change
    eventBus.emit('mobileMenu:animationStyleChanged', { style });

    return this;
  }
}

export default MobileMenu;
