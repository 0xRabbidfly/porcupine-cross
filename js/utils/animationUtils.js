/**
 * Animation Utilities
 * Handles visual effects and animations
 */

/**
 * Creates a mud splat effect at the clicked element
 * @param {HTMLElement} clickedElement - The element that was clicked
 * @returns {boolean} Success status
 */
export function createMudSplat(clickedElement) {
  try {
    if (!clickedElement) return false;
    
    const rect = clickedElement.getBoundingClientRect();
    const particleCount = Math.floor(Math.random() * 8) + 12;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('mud-particle');
      document.body.appendChild(particle);

      const size = Math.random() * 7 + 4;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      const spawnAreaWidthFactor = 0.7;
      const spawnWidth = rect.width * spawnAreaWidthFactor;
      const spawnOffsetX = (rect.width - spawnWidth) / 2;

      const initialX = rect.left + spawnOffsetX + (Math.random() * spawnWidth) - (size / 2);
      const initialY = rect.top + Math.random() * rect.height - (size / 2);
      particle.style.left = `${initialX}px`;
      particle.style.top = `${initialY}px`;

      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 35 + 25;
      const finalX = Math.cos(angle) * distance;
      const finalY = Math.sin(angle) * distance;
      const rotation = (Math.random() - 0.5) * 270;

      particle.style.transform = 'translate(0px, 0px) scale(1)';
      particle.style.opacity = '1';

      requestAnimationFrame(() => {
        particle.style.transform = `translate(${finalX}px, ${finalY}px) scale(0.2) rotate(${rotation}deg)`;
        particle.style.opacity = '0';
      });

      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 900); // Match new particle lifespan (0.8s + buffer)
    }
    
    return true;
  } catch (error) {
    console.error('Error creating mud splat:', error);
    return false;
  }
}

/**
 * Creates a viewport-wide mud splat effect
 * @param {boolean} isMobile - Whether the effect is for mobile
 * @returns {boolean} Success status
 */
export function createViewportWideMudSplat(isMobile = false) {
  try {
    // Earth-toned colors that match the site's aesthetic
    const colors = ['#3b1f04', '#201100', '#542b06', '#633813', '#7a4017'];
    
    // Moderate count and size that match the site's animation style
    const baseCount = 60;
    const extra = 30;
    const particleCount = Math.floor(Math.random() * extra) + baseCount;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('mud-particle');
      
      // Use different colors for variety
      const colorIndex = Math.floor(Math.random() * colors.length);
      particle.style.backgroundColor = colors[colorIndex];
      
      document.body.appendChild(particle);
      
      // Smaller particles that match the site's style
      const size = Math.random() * 18 + 8; // 8-26px, smaller than before
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      const initialX = Math.random() * window.innerWidth;
      const initialY = Math.random() * window.innerHeight;
      particle.style.left = `${initialX}px`;
      particle.style.top = `${initialY}px`;
      
      // Moderate spread that matches the site's animations
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 60 + 20; // Reduced spread (20-80px)
      const finalX = Math.cos(angle) * distance;
      const finalY = Math.sin(angle) * distance;
      const rotation = (Math.random() - 0.5) * 360; // Moderate rotation
      
      // Start already visible
      particle.style.opacity = '1';
      particle.style.transform = `translate(0px, 0px) scale(1) rotate(0deg)`;
      
      // Use timeout instead of requestAnimationFrame for reliability
      setTimeout(() => {
        particle.style.transform = `translate(${finalX}px, ${finalY}px) scale(0.7) rotate(${rotation}deg)`;
        particle.style.opacity = '0.9';
      }, 10);
      
      // Shorter duration to match site animations
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 800);
    }
    
    return true;
  } catch (error) {
    console.error('Error creating viewport-wide mud splat:', error);
    return false;
  }
} 