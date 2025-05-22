/**
 * Animation Bridge
 * 
 * Exposes animation functions to global scope
 * This is a compatibility layer for both module and non-module contexts
 */

// Import the animation system
import AnimationSystem from './core/animationSystem.js';

// Expose the full animation system as a global object
window.AnimationSystem = AnimationSystem;

// Expose individual animation functions for easy access
window.fadeIn = function(element, options) {
  return AnimationSystem.fadeIn(element, options);
};

window.fadeOut = function(element, options) {
  return AnimationSystem.fadeOut(element, options);
};

window.slideInLeft = function(element, options) {
  return AnimationSystem.slideInLeft(element, options);
};

window.slideInRight = function(element, options) {
  return AnimationSystem.slideInRight(element, options);
};

window.slideInTop = function(element, options) {
  return AnimationSystem.slideInTop(element, options);
};

window.slideInBottom = function(element, options) {
  return AnimationSystem.slideInBottom(element, options);
};

window.bounce = function(element, options) {
  return AnimationSystem.bounce(element, options);
};

// Log successful initialization
console.log('Animation Bridge: Enhanced API exposed to global scope');

export default AnimationSystem; 