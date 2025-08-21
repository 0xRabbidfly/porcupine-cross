/**
 * Jest DOM setup file
 */

import '@testing-library/jest-dom';

// Polyfill for KeyboardEvent in Jest environment
if (typeof KeyboardEvent === 'undefined') {
  global.KeyboardEvent = class KeyboardEvent extends Event {
    constructor(type, options = {}) {
      super(type, options);
      this.key = options.key || '';
    }
  };
}
