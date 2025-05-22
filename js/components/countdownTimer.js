/**
 * Countdown Timer Component
 * Handles the race countdown functionality
 */

/* global setInterval, clearInterval */

import AnimationSystem from '../core/animationSystem.js';

/**
 * Calculate time remaining between target date and current date
 * @param {number} targetDate - Target date timestamp
 * @param {number} currentDate - Current date timestamp
 * @returns {Object} Time remaining in days, hours, minutes, seconds
 */
export function calculateTimeRemaining(targetDate, currentDate) {
  const distance = targetDate - currentDate;

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((distance % (1000 * 60)) / 1000),
    distance: distance,
  };
}

/**
 * Countdown Timer class
 */
export class CountdownTimer {
  /**
   * @param {string} targetDateString - Target date string (e.g. 'September 21, 2025 08:00:00')
   * @param {Object} elements - DOM elements for displaying the countdown
   * @param {Object} options - Configuration options
   */
  constructor(targetDateString, elements, options = {}) {
    this.targetDate = new Date(targetDateString).getTime();
    this.elements = elements;
    this.options = options;
    this.intervalId = null;
    this.lastSeconds = -1;
    this.animationClasses = options.animationClasses || { pulse: 'pulse', tick: 'tick' };

    // Allow overriding calculateTimeRemaining for testing
    this.calculateTimeRemaining = options.calculateTimeRemaining || calculateTimeRemaining;
  }

  /**
   * Start the countdown timer
   */
  start() {
    this.update();
    this.intervalId = setInterval(() => this.update(), 1000);
    return this;
  }

  /**
   * Stop the countdown timer
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    return this;
  }

  /**
   * Update the countdown display
   */
  update() {
    const now = this.options.getNow ? this.options.getNow() : new Date().getTime();
    const timeRemaining = this.calculateTimeRemaining(this.targetDate, now);

    // Extract values from time remaining
    const { days, hours, minutes, seconds } = timeRemaining;

    // Update DOM elements if they exist
    if (this.elements.days) {
      this.elements.days.textContent = days.toString().padStart(2, '0');
    }

    if (this.elements.hours) {
      this.elements.hours.textContent = hours.toString().padStart(2, '0');
    }

    if (this.elements.minutes) {
      this.elements.minutes.textContent = minutes.toString().padStart(2, '0');
    }

    if (this.elements.seconds) {
      this.elements.seconds.textContent = seconds.toString().padStart(2, '0');
    }

    // Add animation class on seconds change
    if (seconds !== this.lastSeconds && this.elements.secondsParent) {
      // First ensure previous animations are cleared
      this.elements.secondsParent.classList.remove(this.animationClasses.pulse);
      this.elements.secondsParent.classList.remove(this.animationClasses.tick);

      // Force reflow to ensure animations restart properly
      void this.elements.secondsParent.offsetHeight;

      // Add animation classes
      this.elements.secondsParent.classList.add(this.animationClasses.pulse);
      this.elements.secondsParent.classList.add(this.animationClasses.tick);

      // Remove animation classes after animation completes
      setTimeout(() => {
        if (this.elements.secondsParent) {
          this.elements.secondsParent.classList.remove(this.animationClasses.pulse);
        }
      }, 500);

      setTimeout(() => {
        if (this.elements.secondsParent) {
          this.elements.secondsParent.classList.remove(this.animationClasses.tick);
        }
      }, 1000);

      this.lastSeconds = seconds;
    }

    // If countdown is finished
    if (timeRemaining.distance < 0) {
      this.stop();
      if (this.options.onComplete) {
        this.options.onComplete();
      }
    }

    return timeRemaining;
  }
}
