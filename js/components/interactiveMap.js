/**
 * Interactive Map Component
 * Handles interactive map with hotspots and information panels
 */

import eventBus from '../core/eventBus.js';
import { getElements } from '../utils/domUtils.js';

class InteractiveMap {
  /**
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - Container element
   * @param {HTMLImageElement} options.mapImage - Map image element
   * @param {HTMLElement} options.hotspotsContainer - Hotspots container element
   * @param {NodeList|Array} options.hotspots - Hotspot elements
   * @param {HTMLElement} options.infoPanel - Info panel element
   * @param {NodeList|Array} options.infoContents - Info content elements
   * @param {HTMLElement} options.infoClose - Info close button element
   * @param {number} options.mobileTreshold - Width threshold for mobile mode
   */
  constructor(options = {}) {
    this.container = options.container;
    this.mapImage = options.mapImage;
    this.hotspotsContainer = options.hotspotsContainer;
    this.hotspots = options.hotspots || [];
    this.infoPanel = options.infoPanel;
    this.infoContents = options.infoContents || [];
    this.infoClose = options.infoClose;
    this.mobileThreshold = options.mobileThreshold || 768;

    this.init();
  }

  /**
   * Initialize the interactive map
   */
  init() {
    if (!this.container || !this.mapImage || !this.hotspotsContainer) {
      console.error('Interactive map: Missing required elements');
      return;
    }

    this.setupHotspots();
    this.setupInfoPanel();
    this.alignHotspotsWithImage();

    // Set up resize handler
    window.addEventListener('resize', () => this.alignHotspotsWithImage());

    // Run alignment when the image is loaded
    this.mapImage.addEventListener('load', () => this.alignHotspotsWithImage());

    eventBus.emit('interactiveMap:initialized');
  }

  /**
   * Align hotspots container with the actual image dimensions
   */
  alignHotspotsWithImage() {
    if (!this.mapImage || !this.hotspotsContainer || !this.hotspots.length) return;
    
    // Get the actual rendered dimensions of the image
    const imgRect = this.mapImage.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    
    // Calculate offsets between container and actual image
    const leftOffset = imgRect.left - containerRect.left;
    const topOffset = imgRect.top - containerRect.top;
    
    // Set the hotspot container to match exactly the image position and dimensions
    this.hotspotsContainer.style.position = 'absolute';
    this.hotspotsContainer.style.left = `${leftOffset}px`;
    this.hotspotsContainer.style.top = `${topOffset}px`;
    this.hotspotsContainer.style.width = `${imgRect.width}px`;
    this.hotspotsContainer.style.height = `${imgRect.height}px`;
    
    // Force a reflow/repaint to ensure the container dimensions are updated
    this.hotspotsContainer.offsetHeight;
    
    // Additional verification - ensure each hotspot stays within image bounds
    Array.from(this.hotspots).forEach(hotspot => {
      // Ensure the hotspot's position is within the image bounds
      const left = parseFloat(getComputedStyle(hotspot).left);
      const top = parseFloat(getComputedStyle(hotspot).top);
      
      if (isNaN(left) || isNaN(top)) return;
      
      // Constrain to image boundaries if outside
      if (left < 0) hotspot.style.left = '0px';
      if (left > imgRect.width) hotspot.style.left = `${imgRect.width}px`;
      if (top < 0) hotspot.style.top = '0px';
      if (top > imgRect.height) hotspot.style.top = `${imgRect.height}px`;
    });
    
    eventBus.emit('interactiveMap:aligned');
  }

  /**
   * Set up hotspot click handlers
   */
  setupHotspots() {
    if (!this.hotspots.length || !this.infoPanel) return;

    this.hotspots.forEach(hotspot => {
      hotspot.addEventListener('click', e => {
        e.preventDefault();
        this.handleHotspotClick(hotspot);
      });
    });
  }

  /**
   * Handle hotspot click
   * @param {HTMLElement} hotspot - Clicked hotspot element
   */
  handleHotspotClick(hotspot) {
    const section = hotspot.getAttribute('data-section');

    // Hide all info contents
    this.hideAllInfoContents();

    // Show the selected content
    const activeContent = document.getElementById(section);
    if (activeContent) {
      activeContent.classList.add('active');
    }

    // Position the info panel
    this.positionInfoPanel(hotspot);

    eventBus.emit('interactiveMap:hotspotClicked', { section });
  }

  /**
   * Hide all info content panels
   */
  hideAllInfoContents() {
    this.infoContents.forEach(content => {
      content.classList.remove('active');
    });
  }

  /**
   * Position the info panel next to a hotspot
   * @param {HTMLElement} hotspot - The hotspot element
   */
  positionInfoPanel(hotspot) {
    // Position the info panel next to the clicked dot
    const rect = hotspot.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    // Calculate position relative to the map container
    const left = rect.left - containerRect.left + rect.width / 2;
    const top = rect.top - containerRect.top + rect.height / 2;
    this.infoPanel.style.left = `${left}px`;
    this.infoPanel.style.top = `${top}px`;

    // Reset any edge positioning classes
    this.infoPanel.classList.remove('edge-left', 'edge-right', 'edge-top', 'edge-bottom');

    // Show the panel first to properly calculate its dimensions
    this.infoPanel.classList.add('visible');

    // After panel is visible, check if it's going off screen and adjust if needed
    setTimeout(() => {
      this.adjustInfoPanelPosition();
    }, 10);
  }

  /**
   * Adjust info panel position to stay within viewport
   */
  adjustInfoPanelPosition() {
    if (!this.infoPanel.classList.contains('visible')) return;

    const panelRect = this.infoPanel.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    // Check if we're on mobile
    const isMobile = window.innerWidth <= this.mobileThreshold;

    if (isMobile) {
      // For mobile, position handled by CSS
      this.infoPanel.classList.add('edge-bottom');
    } else {
      // Desktop positioning - adjust if panel is going off screen
      const rightOverflow = panelRect.right > containerRect.right - 20;
      const leftOverflow = panelRect.left < containerRect.left + 20;
      const topOverflow = panelRect.top < containerRect.top + 20;
      const bottomOverflow = panelRect.bottom > containerRect.bottom - 20;

      // Apply appropriate edge class based on overflow
      if (rightOverflow) this.infoPanel.classList.add('edge-right');
      if (leftOverflow) this.infoPanel.classList.add('edge-left');
      if (topOverflow) this.infoPanel.classList.add('edge-top');
      if (bottomOverflow) this.infoPanel.classList.add('edge-bottom');
    }
  }

  /**
   * Set up info panel close button and outside click
   */
  setupInfoPanel() {
    if (!this.infoPanel) return;

    // Close info panel when clicking X
    if (this.infoClose) {
      this.infoClose.addEventListener('click', () => {
        this.closeInfoPanel();
      });
    }

    // Close panel when clicking outside of it
    document.addEventListener('click', e => {
      if (
        this.infoPanel.classList.contains('visible') &&
        !e.target.closest('.map-info-panel') &&
        !e.target.closest('.hotspot')
      ) {
        this.closeInfoPanel();
      }
    });
  }

  /**
   * Close the info panel
   */
  closeInfoPanel() {
    if (this.infoPanel) {
      this.infoPanel.classList.remove('visible');
      this.hideAllInfoContents();
      eventBus.emit('interactiveMap:panelClosed');
    }
  }

  /**
   * Factory method to create an InteractiveMap from selectors
   * @param {Object} selectors - Selector strings for elements
   * @returns {InteractiveMap} New InteractiveMap instance
   */
  static createFromSelectors(selectors = {}) {
    // Default selectors
    const defaultSelectors = {
      container: '.interactive-map-container',
      mapImage: '.course-map',
      hotspotsContainer: '.map-hotspots',
      hotspots: '.hotspot',
      infoPanel: '.map-info-panel',
      infoContents: '.info-content',
      infoClose: '.info-close',
    };

    // Merge default selectors with provided ones
    const finalSelectors = { ...defaultSelectors, ...selectors };

    // Get elements based on selectors
    const container = document.querySelector(finalSelectors.container);
    const mapImage = document.querySelector(finalSelectors.mapImage);
    const hotspotsContainer = document.querySelector(finalSelectors.hotspotsContainer);
    const hotspots = getElements(finalSelectors.hotspots);
    const infoPanel = document.querySelector(finalSelectors.infoPanel);
    const infoContents = getElements(finalSelectors.infoContents);
    const infoClose = document.querySelector(finalSelectors.infoClose);

    // Create and return new instance
    return new InteractiveMap({
      container,
      mapImage,
      hotspotsContainer,
      hotspots,
      infoPanel,
      infoContents,
      infoClose,
    });
  }
}

export default InteractiveMap;
