/**
 * Audio Manager Component
 * Handles sound loading, playback and state management
 */

import eventBus from '../core/eventBus.js';

class AudioManager {
  /**
   * @param {Object} options - Configuration options
   * @param {Object} options.elements - Audio element references
   * @param {HTMLAudioElement} options.elements.clickSound - Click sound element
   * @param {HTMLElement} options.elements.soundToggle - Sound toggle button
   * @param {HTMLElement} options.elements.soundIcon - Sound icon element
   * @param {boolean} options.enabled - Initial sound enabled state
   * @param {number} options.playbackProbability - Probability of playing sound (0-1)
   */
  constructor(options = {}) {
    this.elements = options.elements || {};
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.audioPrimed = false;
    this.playbackProbability = options.playbackProbability || 0.4;
    
    this.init();
  }
  
  /**
   * Initialize the audio manager
   */
  init() {
    this.setupEventListeners();
    this.setupPriming();
    this.updateIcon();
    
    eventBus.emit('audioManager:initialized', { enabled: this.enabled });
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Sound toggle functionality
    if (this.elements.soundToggle && this.elements.soundIcon) {
      this.elements.soundToggle.addEventListener('click', () => {
        this.toggleSound();
      });
    }
  }
  
  /**
   * Set up audio priming for mobile compatibility
   */
  setupPriming() {
    // Prime audio on first user interaction for mobile compatibility
    const primeAudio = () => {
      if (!this.audioPrimed && this.elements.clickSound) {
        this.elements.clickSound.play().then(() => {
          this.elements.clickSound.pause();
          this.elements.clickSound.currentTime = 0;
          this.audioPrimed = true;
          
          eventBus.emit('audioManager:primed');
        }).catch(() => {
          // Silent failure for browsers that block audio
        });
      }
    };
    
    window.addEventListener('touchstart', primeAudio, { once: true });
    window.addEventListener('click', primeAudio, { once: true });
  }
  
  /**
   * Toggle sound enabled/disabled
   * @returns {boolean} New sound enabled state
   */
  toggleSound() {
    this.enabled = !this.enabled;
    this.updateIcon();
    
    // Play the click sound if we're turning sound on
    if (this.enabled && this.elements.clickSound) {
      this.playSound(this.elements.clickSound);
    }
    
    eventBus.emit('audioManager:toggled', { enabled: this.enabled });
    return this.enabled;
  }
  
  /**
   * Update the sound icon based on current state
   */
  updateIcon() {
    if (this.elements.soundIcon && this.elements.soundToggle) {
      if (this.enabled) {
        this.elements.soundIcon.className = 'fa fa-volume-up';
        this.elements.soundToggle.classList.remove('muted');
      } else {
        this.elements.soundIcon.className = 'fa fa-volume-mute';
        this.elements.soundToggle.classList.add('muted');
      }
    }
  }
  
  /**
   * Play a sound with safety checks
   * @param {HTMLAudioElement} soundElement - The audio element to play
   * @returns {Promise|null} A promise that resolves when the sound is played, or null
   */
  playSound(soundElement) {
    // Only play the sound based on probability and if enabled
    if (Math.random() < this.playbackProbability && 
        this.enabled && 
        soundElement && 
        soundElement.readyState >= 2) {
      try {
        soundElement.currentTime = 0;
        return soundElement.play().catch(err => {
          // Suppress errors - browser might block autoplay until user interaction
          console.warn('Sound play prevented:', err);
          return null;
        });
      } catch (err) {
        // Fallback for any errors
        console.warn('Error playing sound:', err);
        return null;
      }
    }
    return null;
  }
  
  /**
   * Play the click sound
   * @returns {Promise|null} A promise that resolves when the sound is played, or null
   */
  playClickSound() {
    if (this.elements.clickSound) {
      return this.playSound(this.elements.clickSound);
    }
    return null;
  }
  
  /**
   * Set sound enabled state
   * @param {boolean} enabled - Whether sound should be enabled
   */
  setEnabled(enabled) {
    if (this.enabled !== enabled) {
      this.enabled = enabled;
      this.updateIcon();
      eventBus.emit('audioManager:toggled', { enabled: this.enabled });
    }
  }
}

export default AudioManager; 