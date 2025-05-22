/**
 * Mobile Menu Component
 * 
 * Implements proper state management and CSS transitions
 * for the mobile menu. Uses transitionend events instead of timeouts.
 */

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
      ...options
    };
    
    // State
    this.state = {
      isOpen: false,
      isAnimating: false
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
    
    // Close menu on outside click
    document.addEventListener('click', this.handleDocumentClick.bind(this));
    
    // Listen for transition end
    this.menu.addEventListener('transitionend', this.handleTransitionEnd.bind(this));
    
    // Set initial ARIA attributes
    this.toggle.setAttribute('aria-expanded', 'false');
    
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
    event.preventDefault();
    event.stopPropagation();
    
    this.toggleMenu();
  }
  
  /**
   * Handle document click to close menu when clicking outside
   * @param {Event} event - The click event
   */
  handleDocumentClick(event) {
    if (this.state.isOpen && 
        !this.state.isAnimating &&
        !this.menu.contains(event.target) &&
        !this.toggle.contains(event.target)) {
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
      }, 100);
      
      // Navigate after delay
      setTimeout(() => {
        window.location.hash = href;
      }, 600);
    }
  }
  
  /**
   * Handle transition end event
   * @param {Event} event - The transitionend event
   */
  handleTransitionEnd() {
    this.state.isAnimating = false;
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
    
    // Fallback for browsers without transition support
    if (!('ontransitionend' in window)) {
      setTimeout(() => {
        this.state.isAnimating = false;
      }, this.options.transitionDuration);
    }
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
    
    // Fallback for browsers without transition support
    if (!('ontransitionend' in window)) {
      setTimeout(() => {
        this.state.isAnimating = false;
      }, this.options.transitionDuration);
    }
  }
  
  /**
   * Get current menu state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  }
}

export default MobileMenu; 