/**
 * Hero Card Rotator Component
 *
 * Cross-fades the hero card artwork with event photos on a timer.
 */

import eventBus from '../core/eventBus.js';

const DEFAULT_INTERVAL_MS = 7000;
const ACTIVE_CLASS = 'is-active';

class HeroCardRotator {
  /**
   * @param {HTMLElement} container - Element holding the `.hero-card-slide` images
   * @param {Object} options - Configuration options
   * @param {number} [options.intervalMs] - Milliseconds between slides
   */
  constructor(container, options = {}) {
    this.container = container;
    this.slides = Array.from(container.querySelectorAll('.hero-card-slide'));
    this.intervalMs =
      options.intervalMs || Number(container.dataset.rotateInterval) || DEFAULT_INTERVAL_MS;
    this.intervalId = null;

    const activeIndex = this.slides.findIndex(slide => slide.classList.contains(ACTIVE_CLASS));
    this.currentIndex = activeIndex === -1 ? 0 : activeIndex;
  }

  /**
   * Create and start a rotator for every matching container
   * @param {string} selector - Container selector
   * @returns {HeroCardRotator[]} Started rotators
   */
  static createAll(selector = '.hero-card-rotator') {
    return Array.from(document.querySelectorAll(selector)).map(container =>
      new HeroCardRotator(container).start()
    );
  }

  /**
   * Start rotating slides
   */
  start() {
    if (this.intervalId || this.slides.length < 2) {
      return this;
    }

    this.showSlide(this.currentIndex);
    this.intervalId = setInterval(() => this.next(), this.intervalMs);
    return this;
  }

  /**
   * Advance to the next slide
   */
  next() {
    this.showSlide((this.currentIndex + 1) % this.slides.length);
    return this;
  }

  /**
   * Display the slide at the given index
   * @param {number} index - Slide index
   */
  showSlide(index) {
    this.slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === index;
      slide.classList.toggle(ACTIVE_CLASS, isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
    });

    this.currentIndex = index;
    eventBus.emit('heroCard:changed', { index });
    return this;
  }

  /**
   * Stop rotating and release the timer
   */
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    return this;
  }
}

export default HeroCardRotator;
