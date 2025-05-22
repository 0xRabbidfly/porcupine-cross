// Animation Bridge - Exposes module functions to global scope
import { createMudSplat, createViewportWideMudSplat } from './utils/animationUtils.js';

// Explicitly expose functions to window
window.createMudSplat = createMudSplat;
window.createViewportWideMudSplat = createViewportWideMudSplat;

// Log successful initialization
console.log('Animation Bridge: Functions exposed to global scope'); 