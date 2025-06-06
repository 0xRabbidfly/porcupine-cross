/**
 * Interactive Map Component
 * Handles interactive map with hotspots and information panels
 */

import eventBus from '../core/eventBus.js';
import { getElements } from '../utils/domUtils.js';
import AnimationSystem from '../core/animationSystem.js';

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

    // Get the actual rendered dimensions and position of the image
    const imgRect = this.mapImage.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    // Calculate the image's position relative to its container (accounts for centering)
    const leftOffset = imgRect.left - containerRect.left;

    // Add class for base positioning
    this.hotspotsContainer.classList.add('map-hotspots-aligned');

    // Set custom CSS properties for positioning
    this.hotspotsContainer.style.setProperty('--hotspots-left', `${leftOffset}px`);
    this.hotspotsContainer.style.setProperty('--hotspots-width', `${imgRect.width}px`);
    this.hotspotsContainer.style.setProperty('--hotspots-height', `${imgRect.height}px`);

    // Force a reflow/repaint to ensure the positions are updated
    this.hotspotsContainer.offsetHeight;

    eventBus.emit('interactiveMap:aligned');
  }

  /**
   * Set up hotspot click handlers
   */
  setupHotspots() {
    if (!this.hotspots.length || !this.infoPanel) return;

    this.hotspots.forEach(hotspot => {
      hotspot.setAttribute('tabindex', '0');
      hotspot.addEventListener('click', () => {
        this.handleHotspotClick(hotspot);
      });
      hotspot.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleHotspotClick(hotspot);
        }
      });
    });
  }

  /**
   * Handle hotspot click
   * @param {HTMLElement} hotspot - Clicked hotspot element
   */
  handleHotspotClick(hotspot) {
    const section = hotspot.getAttribute('data-section');
    this.hideAllInfoContents();
    const activeContent = document.getElementById(section);
    if (activeContent) {
      AnimationSystem.fadeIn(activeContent);
      activeContent.classList.add('active');
    }
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

    // Position as percentage of container width/height
    const percentX = (left / containerRect.width) * 100;
    const percentY = (top / containerRect.height) * 100;

    // Set custom CSS properties for positioning
    this.infoPanel.style.setProperty('--info-panel-left', `${percentX}%`);
    this.infoPanel.style.setProperty('--info-panel-top', `${percentY}%`);

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

    if (this.infoClose) {
      this.infoClose.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.hideInfoPanel();
        }
      });
    }
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
