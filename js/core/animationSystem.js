/**
 * Animation System
 *
 * A unified animation API that works in both module and non-module environments
 * Uses CSS for animations and JavaScript for state management
 */

// Feature detection - use safer checks to avoid linter errors
const supportsPromises = typeof Promise !== 'undefined';
const supportsTransitions = typeof window !== 'undefined' && 'ontransitionend' in window;
const supportsAnimations = typeof window !== 'undefined' && 'onanimationend' in window;
const supportsCssVariables =
  typeof window !== 'undefined' &&
  window.CSS &&
  window.CSS.supports &&
  window.CSS.supports('--custom: value');

/**
 * AnimationSystem - Singleton pattern
 */
const AnimationSystem = (function () {
  // Private state
  const queue = [];
  let isProcessing = false;
  let lastId = 0;
  const activeAnimations = new Map();

  // Animation types registry
  const animationTypes = {
    'fade-in': { cssClass: 'fade-in', duration: 500 },
    'fade-out': { cssClass: 'fade-out', duration: 500 },
    'slide-in-left': { cssClass: 'slide-in-left', duration: 500 },
    'slide-in-right': { cssClass: 'slide-in-right', duration: 500 },
    'slide-in-top': { cssClass: 'slide-in-top', duration: 500 },
    'slide-in-bottom': { cssClass: 'slide-in-bottom', duration: 500 },
    bounce: { cssClass: 'bounce', duration: 500 },
    'mud-splat': { cssClass: 'mud-splat', duration: 900 },
    'mud-splat-viewport': { cssClass: 'mud-splat-viewport', duration: 800 },
  };

  // Detect module support
  const detectModuleSupport = () => {
    try {
      new Function('return import("")');
      return true;
    } catch {
      return false;
    }
  };

  // Process animation queue
  const processQueue = () => {
    if (isProcessing || queue.length === 0) return;

    isProcessing = true;
    const animation = queue.shift();

    // Execute animation
    animation
      .execute()
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

  // Generate a unique ID for each animation
  const generateId = () => `animation_${++lastId}`;

  // Create a mud particle element
  const createParticle = (options = {}) => {
    const particle = document.createElement('div');
    const size = options.size || Math.random() * 7 + 4;

    // Add classes
    particle.classList.add('mud-particle');
    if (options.viewport) {
      particle.classList.add('mud-splat-viewport');
    } else {
      particle.classList.add('mud-splat');
    }

    // Set size
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // Set position
    particle.style.left = `${options.x || 0}px`;
    particle.style.top = `${options.y || 0}px`;

    // Set custom properties for animation
    particle.style.setProperty('--mud-x', `${options.destX || 30}px`);
    particle.style.setProperty('--mud-y', `${options.destY || 30}px`);
    particle.style.setProperty('--mud-rotation', `${options.rotation || 180}deg`);

    // Set color if provided
    if (options.color) {
      particle.style.backgroundColor = options.color;
    }

    return particle;
  };

  // Add event listener with proper event cleanup
  const addAnimationEndListener = (element, callback, options = {}) => {
    const { duration = 500, type = 'animation', once = true } = options;

    let eventName;
    if (type === 'animation' && supportsAnimations) {
      eventName = 'animationend';
    } else if (type === 'transition' && supportsTransitions) {
      eventName = 'transitionend';
    }

    // If proper event is supported, use it
    if (eventName) {
      element.addEventListener(eventName, callback, { once });
      return () => element.removeEventListener(eventName, callback);
    }

    // Fallback to timeout
    const timeoutId = setTimeout(callback, duration);
    return () => clearTimeout(timeoutId);
  };

  // Public API
  return {
    // Animation registry
    animations: animationTypes,

    /**
     * Register a new animation type
     * @param {string} name - Animation name
     * @param {Object} config - Animation configuration
     * @returns {this} For chaining
     */
    registerAnimation(name, config) {
      if (!name || typeof name !== 'string') {
        console.error('Animation name must be a string');
        return this;
      }

      animationTypes[name] = {
        cssClass: config.cssClass || name,
        duration: config.duration || 300,
        ...config,
      };

      return this;
    },

    /**
     * Run a named animation on an element
     * @param {HTMLElement} element - Element to animate
     * @param {string} animationName - Name of the animation to run
     * @param {Object} options - Animation options
     * @returns {Promise} Animation completion promise
     */
    animate(element, animationName, options = {}) {
      if (!element || !(element instanceof HTMLElement)) {
        return Promise.reject(new Error('Valid HTMLElement required'));
      }

      if (!animationName || !animationTypes[animationName]) {
        return Promise.reject(new Error(`Unknown animation: ${animationName}`));
      }

      const animationConfig = animationTypes[animationName];
      const animationId = generateId();

      return new Promise(resolve => {
        // Track this animation
        activeAnimations.set(animationId, { element, config: animationConfig });

        // Apply CSS variables if supported and provided
        if (supportsCssVariables && options.variables) {
          Object.entries(options.variables).forEach(([key, value]) => {
            element.style.setProperty(`--${key}`, value);
          });
        }

        // Add animation class
        element.classList.add('animate', animationConfig.cssClass);

        // Set up cleanup
        const cleanup = () => {
          element.classList.remove('animate', animationConfig.cssClass);
          activeAnimations.delete(animationId);
          resolve();
        };

        // Add event listener
        addAnimationEndListener(element, cleanup, {
          duration: options.duration || animationConfig.duration,
          type: options.type || 'animation',
        });
      });
    },

    /**
     * Create mud splat effect at a specific element
     * @param {HTMLElement} element - Element to create splat at
     * @param {Object} options - Animation options
     * @returns {Promise} Animation completion promise
     */
    createMudSplat(element, options = {}) {
      if (!element) {
        console.error('Element required for createMudSplat');
        return Promise.reject(new Error('Element required'));
      }

      return new Promise(resolve => {
        const rect = element.getBoundingClientRect();
        const particleCount = options.count || Math.floor(Math.random() * 8) + 12;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
          // Calculate spawn position
          const spawnAreaWidthFactor = 0.7;
          const spawnWidth = rect.width * spawnAreaWidthFactor;
          const spawnOffsetX = (rect.width - spawnWidth) / 2;

          const size = Math.random() * 7 + 4;
          const initialX = rect.left + spawnOffsetX + Math.random() * spawnWidth - size / 2;
          const initialY = rect.top + Math.random() * rect.height - size / 2;

          // Calculate destination
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * 35 + 25;
          const destX = Math.cos(angle) * distance;
          const destY = Math.sin(angle) * distance;
          const rotation = (Math.random() - 0.5) * 270;

          // Create particle
          const particle = createParticle({
            x: initialX,
            y: initialY,
            destX,
            destY,
            rotation,
            size,
          });

          // Add to document
          document.body.appendChild(particle);
          particles.push(particle);

          // Clean up when animation ends
          const cleanup = () => {
            if (particle.parentNode) {
              particle.parentNode.removeChild(particle);
            }

            // Check if all particles are done
            const index = particles.indexOf(particle);
            if (index !== -1) {
              particles.splice(index, 1);
              if (particles.length === 0) {
                resolve();
              }
            }
          };

          // Add event listener
          addAnimationEndListener(particle, cleanup, {
            duration: 900,
            type: 'animation',
          });
        }
      });
    },

    /**
     * Create viewport-wide mud splat effect
     * @param {Object} options - Animation options
     * @returns {Promise} Animation completion promise
     */
    createViewportSplat(options = {}) {
      return new Promise(resolve => {
        // Earth-toned colors
        const colors = options.colors || ['#3b1f04', '#201100', '#542b06', '#633813', '#7a4017'];

        // Particle count
        const baseCount = options.baseCount || 60;
        const extra = options.extra || 30;
        const particleCount = Math.floor(Math.random() * extra) + baseCount;

        const particles = [];

        for (let i = 0; i < particleCount; i++) {
          // Calculate spawn position
          const initialX = Math.random() * window.innerWidth;
          const initialY = Math.random() * window.innerHeight;

          // Calculate destination
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * 60 + 20;
          const destX = Math.cos(angle) * distance;
          const destY = Math.sin(angle) * distance;
          const rotation = (Math.random() - 0.5) * 360;

          // Select random color
          const colorIndex = Math.floor(Math.random() * colors.length);
          const color = colors[colorIndex];

          // Create particle
          const particle = createParticle({
            x: initialX,
            y: initialY,
            destX,
            destY,
            rotation,
            size: Math.random() * 18 + 8,
            color,
            viewport: true,
          });

          // Add to document
          document.body.appendChild(particle);
          particles.push(particle);

          // Clean up when animation ends
          const cleanup = () => {
            if (particle.parentNode) {
              particle.parentNode.removeChild(particle);
            }

            // Check if all particles are done
            const index = particles.indexOf(particle);
            if (index !== -1) {
              particles.splice(index, 1);
              if (particles.length === 0) {
                resolve();
              }
            }
          };

          // Add event listener
          addAnimationEndListener(particle, cleanup, {
            duration: 800,
            type: 'animation',
          });
        }
      });
    },

    /**
     * Add element to animation queue
     * @param {Function} animationFn - Animation function to execute
     * @returns {this} For chaining
     */
    queue(animationFn) {
      if (typeof animationFn !== 'function') {
        console.error('Animation function required for queue');
        return this;
      }

      const id = generateId();
      queue.push({
        id,
        execute: () => {
          return Promise.resolve().then(() => animationFn());
        },
      });

      // Start processing if not already
      if (!isProcessing) {
        processQueue();
      }

      return this;
    },

    /**
     * Apply a fade-in animation to an element
     * @param {HTMLElement} element - Element to animate
     * @param {Object} options - Animation options
     * @returns {Promise} Animation completion promise
     */
    fadeIn(element, options = {}) {
      return this.animate(element, 'fade-in', options);
    },

    /**
     * Apply a fade-out animation to an element
     * @param {HTMLElement} element - Element to animate
     * @param {Object} options - Animation options
     * @returns {Promise} Animation completion promise
     */
    fadeOut(element, options = {}) {
      return this.animate(element, 'fade-out', options);
    },

    /**
     * Apply a slide-in animation from the left
     * @param {HTMLElement} element - Element to animate
     * @param {Object} options - Animation options
     * @returns {Promise} Animation completion promise
     */
    slideInLeft(element, options = {}) {
      return this.animate(element, 'slide-in-left', options);
    },

    /**
     * Apply a slide-in animation from the right
     * @param {HTMLElement} element - Element to animate
     * @param {Object} options - Animation options
     * @returns {Promise} Animation completion promise
     */
    slideInRight(element, options = {}) {
      return this.animate(element, 'slide-in-right', options);
    },

    /**
     * Apply a slide-in animation from the top
     * @param {HTMLElement} element - Element to animate
     * @param {Object} options - Animation options
     * @returns {Promise} Animation completion promise
     */
    slideInTop(element, options = {}) {
      return this.animate(element, 'slide-in-top', options);
    },

    /**
     * Apply a slide-in animation from the bottom
     * @param {HTMLElement} element - Element to animate
     * @param {Object} options - Animation options
     * @returns {Promise} Animation completion promise
     */
    slideInBottom(element, options = {}) {
      return this.animate(element, 'slide-in-bottom', options);
    },

    /**
     * Apply a bounce animation to an element
     * @param {HTMLElement} element - Element to animate
     * @param {Object} options - Animation options
     * @returns {Promise} Animation completion promise
     */
    bounce(element, options = {}) {
      return this.animate(element, 'bounce', options);
    },

    /**
     * Cancel all active animations on an element
     * @param {HTMLElement} element - Element to cancel animations for
     * @returns {this} For chaining
     */
    cancelAnimations(element) {
      if (!element) return this;

      activeAnimations.forEach((animation, id) => {
        if (animation.element === element) {
          element.classList.remove('animate', animation.config.cssClass);
          activeAnimations.delete(id);
        }
      });

      return this;
    },

    /**
     * Check if the browser supports modern animation features
     * @returns {Object} Object with support flags
     */
    getSupportInfo() {
      return {
        promises: supportsPromises,
        transitions: supportsTransitions,
        animations: supportsAnimations,
        cssVariables: supportsCssVariables,
        modules: detectModuleSupport(),
      };
    },
  };
})();

// Export for ES modules
export default AnimationSystem;
