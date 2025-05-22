/**
 * Animation Bridge
 * 
 * Exposes animation functions to global scope
 * This is a compatibility layer for both module and non-module contexts
 */

// Import the animation system
import AnimationSystem from './core/animationSystem.js';

// For backwards compatibility with existing code
window.createMudSplat = function(element) {
  return AnimationSystem.createMudSplat(element);
};

window.createViewportWideMudSplat = function(isMobile) {
  return AnimationSystem.createViewportSplat({
    mobile: isMobile
  });
};

// Log successful initialization
console.log('Animation Bridge: Updated functions exposed to global scope');

export default AnimationSystem; 