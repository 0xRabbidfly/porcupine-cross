/**
 * Event Bus
 * Simple publish-subscribe pattern implementation for component communication
 */

class EventBus {
  constructor() {
    this.events = {};
    this.onceCallbacks = new Set();
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event].push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event only once
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  once(event, callback) {
    const wrappedCallback = (...args) => {
      this.off(event, wrappedCallback);
      callback(...args);
    };
    
    this.onceCallbacks.add(wrappedCallback);
    return this.on(event, wrappedCallback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(cb => cb !== callback);
    this.onceCallbacks.delete(callback);
    
    // Clean up if no callbacks left
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
  }

  /**
   * Publish an event
   * @param {string} event - Event name
   * @param {any} args - Arguments to pass to callbacks
   */
  emit(event, ...args) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event ${event} callback:`, error);
      }
    });
  }

  /**
   * Remove all event listeners
   * @param {string} event - Optional event name to clear only that event
   */
  clear(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
      this.onceCallbacks.clear();
    }
  }
}

// Create a singleton instance
const eventBus = new EventBus();

export default eventBus; 