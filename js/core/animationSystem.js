/**
 * Animation System
 * 
 * A unified animation API that works in both module and non-module environments
 * Uses CSS for animations and JavaScript for state management
 */

// Feature detection - use safer checks to avoid linter errors
// Note: We'll determine module support at runtime instead of static check
const supportsPromises = typeof Promise !== 'undefined';
const supportsTransitions = typeof window !== 'undefined' && 'ontransitionend' in window;
const supportsAnimations = typeof window !== 'undefined' && 'onanimationend' in window;

/**
 * AnimationSystem - Singleton pattern
 */
const AnimationSystem = (function() {
  // Private state
  const queue = [];
  let isProcessing = false;
  let lastId = 0;
  
  // Detect module support
  const detectModuleSupport = () => {
    try {
      new Function('return import("")');
      return true;
    } catch (err) {
      return false;
    }
  };
  
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
  
  // Generate a unique ID for each animation
  const generateId = () => `animation_${++lastId}`;
  
  // Create a mud particle element
  const createParticle = (options = {}) => {
    const particle = document.createElement('div');
    const size = options.size || (Math.random() * 7 + 4);
    
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
  
  // Public API
  return {
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
          const initialX = rect.left + spawnOffsetX + (Math.random() * spawnWidth) - (size / 2);
          const initialY = rect.top + Math.random() * rect.height - (size / 2);
          
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
            size
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
          
          // Listen for animation end
          if (supportsAnimations) {
            particle.addEventListener('animationend', cleanup, { once: true });
          } else {
            // Fallback to timeout
            setTimeout(cleanup, 900);
          }
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
            viewport: true
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
          
          // Listen for animation end
          if (supportsAnimations) {
            particle.addEventListener('animationend', cleanup, { once: true });
          } else {
            // Fallback to timeout
            setTimeout(cleanup, 800);
          }
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
      
      const animation = {
        id: generateId(),
        execute: () => {
          return Promise.resolve().then(animationFn);
        }
      };
      
      queue.push(animation);
      processQueue();
      return this;
    },
    
    /**
     * Feature detection for progressive enhancement
     */
    supports: {
      modules: detectModuleSupport(),
      promises: supportsPromises,
      transitions: supportsTransitions,
      animations: supportsAnimations
    }
  };
})();

// Export for ES modules
export default AnimationSystem;

// Expose to window for non-module environments
if (typeof window !== 'undefined') {
  window.AnimationSystem = AnimationSystem;
} 