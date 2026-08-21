/**
 * Register Phase Component
 *
 * Swaps the registration call-to-action for the race results card once the
 * event has finished.
 */

import eventBus from '../core/eventBus.js';

const CHECK_INTERVAL_MS = 60000;

class RegisterPhase {
  /**
   * @param {HTMLElement} container - Element with `data-flip-at` and phase panels
   * @param {Object} options - Configuration options
   * @param {Function} [options.getNow] - Returns the current timestamp
   */
  constructor(container, options = {}) {
    this.container = container;
    this.flipAt = new Date(container.dataset.flipAt).getTime();
    this.prePanel = container.querySelector('[data-phase="pre"]');
    this.postPanel = container.querySelector('[data-phase="post"]');
    this.getNow = options.getNow || (() => Date.now());
    this.intervalId = null;
    this.phase = null;
  }

  /**
   * Create and start a phase switch for the first matching container
   * @param {string} selector - Container selector
   * @returns {RegisterPhase|null} Started instance, or null when absent
   */
  static create(selector = '.register-phase') {
    const container = document.querySelector(selector);
    return container ? new RegisterPhase(container).start() : null;
  }

  /**
   * Apply the current phase and keep checking for the flip
   */
  start() {
    if (!this.prePanel || !this.postPanel || Number.isNaN(this.flipAt)) {
      return this;
    }

    this.update();
    this.intervalId = setInterval(() => this.update(), CHECK_INTERVAL_MS);
    return this;
  }

  /**
   * Show the panel matching the current time
   */
  update() {
    const phase = this.getNow() >= this.flipAt ? 'post' : 'pre';
    if (phase === this.phase) {
      return this;
    }

    this.phase = phase;
    this.prePanel.hidden = phase !== 'pre';
    this.postPanel.hidden = phase !== 'post';
    eventBus.emit('register:phaseChanged', { phase });
    return this;
  }

  /**
   * Stop checking and release the timer
   */
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    return this;
  }
}

export default RegisterPhase;
