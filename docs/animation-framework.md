# Animation Framework Refactoring

## Current Issues
- Duplicate animation code in multiple files
- Module and non-module environments handled inconsistently
- Direct DOM manipulation from animation functions
- Timeout-based animation state management
- Limited animation options and customization

## Architecture Goals
1. Create a unified animation API that works in all environments
2. Use CSS for animations, JavaScript for state management
3. Support progressive enhancement
4. Make animations configurable and extensible

## Implementation Plan

### 1. CSS Animation System
1. Create CSS classes for all animation types:
   - Mud splats
   - Transitions
   - Fades
   - Etc.
2. Use CSS custom properties for customization
3. Define animation keyframes centrally

### 2. JavaScript Animation Bridge
1. Refactor animationBridge.js to follow singleton pattern
2. Provide consistent API for both module and non-module environments
3. Use feature detection for progressive enhancement
4. Implement animation queue to prevent conflicts

### 3. Animation Factory
1. Create a factory pattern for generating animations
2. Support multiple animation types
3. Provide customization options
4. Handle cleanup automatically

## Code Structure

### CSS Animation Classes
```css
/* Animation system */
:root {
  --animation-duration-fast: 0.2s;
  --animation-duration-default: 0.3s;
  --animation-duration-slow: 0.5s;
  --animation-easing-default: cubic-bezier(0.2, 0.8, 0.7, 1);
}

/* Base animation classes */
.animate {
  animation-fill-mode: both;
  animation-timing-function: var(--animation-easing-default);
}

/* Mud splat animation */
.mud-particle {
  position: fixed;
  background-color: #3b1f04;
  border-radius: 50%;
  pointer-events: none;
  z-index: 10000;
  box-shadow: 0 0 5px rgba(0,0,0,0.5);
  animation: mud-fade var(--animation-duration-default) var(--animation-easing-default);
}

@keyframes mud-fade {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--mud-x, 30px), var(--mud-y, 30px)) scale(0.2);
    opacity: 0;
  }
}
```

### JavaScript Animation API
```javascript
/**
 * Animation System singleton
 */
const AnimationSystem = (function() {
  // Private state
  const queue = [];
  let isProcessing = false;
  
  // Feature detection
  const supportsModules = typeof import === 'function';
  const supportsPromises = typeof Promise === 'function';
  const supportsTransitions = 'ontransitionend' in window;
  
  // Process animation queue
  const processQueue = () => {
    if (isProcessing || queue.length === 0) return;
    
    isProcessing = true;
    const animation = queue.shift();
    
    // Execute animation
    animation.execute()
      .then(() => {
        isProcessing = false;
        processQueue(); // Process next animation
      })
      .catch(error => {
        console.error('Animation error:', error);
        isProcessing = false;
        processQueue(); // Continue with next animation
      });
  };
  
  // Public API
  return {
    // Create mud splat animation
    createMudSplat(element, options = {}) {
      const animation = {
        execute: () => {
          return new Promise(resolve => {
            // Implementation details...
            resolve();
          });
        }
      };
      
      queue.push(animation);
      processQueue();
      return this; // For chaining
    },
    
    // Create viewport-wide animation
    createViewportAnimation(options = {}) {
      const animation = {
        execute: () => {
          return new Promise(resolve => {
            // Implementation details...
            resolve();
          });
        }
      };
      
      queue.push(animation);
      processQueue();
      return this; // For chaining
    },
    
    // Feature detection
    supports: {
      modules: supportsModules,
      promises: supportsPromises,
      transitions: supportsTransitions
    }
  };
})();

// Export for ES modules
export default AnimationSystem;

// Expose to window for non-module environments
window.AnimationSystem = AnimationSystem;
```

## Implementation Strategy
1. Create new CSS animation classes
2. Implement AnimationSystem singleton
3. Update existing code to use new API
4. Test in both module and non-module environments
5. Remove old animation code

## Testing Plan
1. Test in multiple browsers
2. Test with module and non-module loading
3. Verify animation queueing works correctly
4. Test performance with many simultaneous animations 