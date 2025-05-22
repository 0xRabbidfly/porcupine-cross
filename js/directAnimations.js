// Direct animation functions that don't rely on ES modules
// This is a fallback in case the module exports don't work

// Creates particles directly
function createParticlesDirectly(isMobile) {
  // Create particles
  const particleCount = 25;
  const colors = ['red', 'blue', 'green', 'orange', 'purple'];
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    
    // Style the particle
    particle.style.position = 'fixed';
    particle.style.width = '50px';
    particle.style.height = '50px';
    particle.style.borderRadius = '50%';
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.zIndex = '10000';
    particle.style.pointerEvents = 'none';
    particle.style.boxShadow = '0 0 20px rgba(0,0,0,0.8)';
    
    // Position randomly
    particle.style.left = (Math.random() * window.innerWidth) + 'px';
    particle.style.top = (Math.random() * window.innerHeight) + 'px';
    
    // Add text
    particle.innerText = "!";
    particle.style.display = 'flex';
    particle.style.alignItems = 'center';
    particle.style.justifyContent = 'center';
    particle.style.color = 'white';
    particle.style.fontWeight = 'bold';
    particle.style.fontSize = '36px';
    
    // Add to document
    document.body.appendChild(particle);
    
    // Remove after delay
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, 3000);
  }
  
  return true;
}

// Expose to window
window.createParticlesDirectly = createParticlesDirectly;
console.log("Direct animation functions loaded"); 