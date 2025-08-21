/**
 * SMOLDERCHAD Easter Egg Component
 *
 * Listens for 'wtf' keystrokes and displays a rotating SMOLDERCHAD image
 * with "Designed and Built by Nuno Borges" overlay
 */

class SmolderchadEasterEgg {
  constructor() {
    this.triggerSequence = 'wtf';
    this.currentSequence = '';
    this.isActive = false;
    this.element = null;
    this.rotationInterval = null;
    this.tapCount = 0;
    this.lastTapTime = 0;
    this.tapTimeout = null;

    this.init();
  }

  init() {
    this.setupKeyboardListener();
    this.setupTouchListener();
    this.createEasterEggElement();
  }

  setupKeyboardListener() {
    document.addEventListener('keydown', event => {
      // Only listen for letter keys
      if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
        this.handleKeyPress(event.key.toLowerCase());
      }
    });
  }

  setupTouchListener() {
    // Try to find spade logo with retry mechanism
    this.setupSpadeLogoListener();
  }

  setupSpadeLogoListener() {
    // Try to find spade logo immediately
    let spadeLogo = document.querySelector('.surface-logo');

    if (spadeLogo) {
      this.attachSpadeLogoEvents(spadeLogo);
    } else {
      // If not found, wait for DOM to be ready and retry
      setTimeout(() => {
        spadeLogo = document.querySelector('.surface-logo');

        if (spadeLogo) {
          this.attachSpadeLogoEvents(spadeLogo);
        } else {
          // Final retry after a bit more time
          setTimeout(() => {
            spadeLogo = document.querySelector('.surface-logo');

            if (spadeLogo) {
              this.attachSpadeLogoEvents(spadeLogo);
            }
          }, 1000);
        }
      }, 500);
    }
  }

  attachSpadeLogoEvents(spadeLogo) {
    // Add both click and touch events for mobile compatibility
    spadeLogo.addEventListener('click', _event => {
      if (!this.isActive) {
        this.triggerEasterEgg();
      }
    });

    // Also add touchstart for mobile devices
    spadeLogo.addEventListener('touchstart', _event => {
      if (!this.isActive) {
        _event.preventDefault(); // Prevent double-trigger
        this.triggerEasterEgg();
      }
    });
  }

  handleKeyPress(key) {
    this.currentSequence += key;

    // Keep only the last N characters where N is the length of the trigger
    if (this.currentSequence.length > this.triggerSequence.length) {
      this.currentSequence = this.currentSequence.slice(-this.triggerSequence.length);
    }

    // Check if we've typed the trigger sequence
    if (this.currentSequence === this.triggerSequence && !this.isActive) {
      this.triggerEasterEgg();
    }
  }

  createEasterEggElement() {
    // Create the container
    this.element = document.createElement('div');
    this.element.className = 'smolderchad-easter-egg';
    this.element.style.display = 'none';

    // Create the image container for relative positioning
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';

    // Create the image
    const image = document.createElement('img');
    image.src = 'images/SMOLDERCHAD.jpeg';
    image.alt = 'SMOLDERCHAD';

    // Create the credit text panel with fancy background
    const creditPanel = document.createElement('div');
    creditPanel.className = 'credit-panel';

    const credit = document.createElement('div');
    credit.className = 'credit';
    credit.textContent = 'Designed and Built by Nuno Borges';

    creditPanel.appendChild(credit);

    // Add elements to container
    imageContainer.appendChild(image);
    imageContainer.appendChild(creditPanel);
    this.element.appendChild(imageContainer);

    // Add to DOM
    document.body.appendChild(this.element);
  }

  triggerEasterEgg() {
    if (this.isActive) return;

    this.isActive = true;
    this.currentSequence = ''; // Reset sequence

    // Track easter egg trigger
    this.trackEasterEggEvent();

    // Show the element
    this.element.style.display = 'block';
    this.element.style.opacity = '0';
    this.element.style.transform = 'translate(-50%, -50%) scale(0.5) rotate(0deg)';

    // Fade in and scale up
    requestAnimationFrame(() => {
      this.element.style.transition = 'all 0.5s ease-out';
      this.element.style.opacity = '1';
      this.element.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
    });

    // Start heartbeat animation for 3 seconds
    setTimeout(() => {
      this.startHeartbeat();
    }, 500);

    // Start spiral after heartbeat (3.5 seconds total)
    setTimeout(() => {
      this.startRotation();
    }, 3500);

    // Hide after 7.5 seconds total (3s heartbeat + 4s spiral)
    setTimeout(() => {
      this.hideEasterEgg();
    }, 7500);
  }

  startHeartbeat() {
    // Add heartbeat class for CSS animation
    this.element.classList.add('heartbeat');
  }

  startRotation() {
    // Remove heartbeat class
    this.element.classList.remove('heartbeat');

    let rotation = 0;
    let scale = 1;
    let step = 0;
    const totalSteps = 80; // 4 seconds at 50ms intervals

    this.rotationInterval = setInterval(() => {
      step++;

      // Simple linear rotation and scale
      rotation += 15; // 15 degrees per step

      if (step < 40) {
        // First half: normal size, just rotate
        scale = 1;
      } else {
        // Second half: shrink while rotating
        const shrinkProgress = (step - 40) / 40;
        scale = 1 - shrinkProgress * 0.9; // Scale down to 0.1
      }

      // Apply transform
      this.element.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`;

      // Stop when done
      if (step >= totalSteps) {
        clearInterval(this.rotationInterval);
        this.rotationInterval = null;
        this.createExplosion();
      }
    }, 50);
  }

  createExplosion() {
    // Create explosion effect
    const explosion = document.createElement('div');
    explosion.className = 'explosion';

    // Add explosion particles
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      particle.className = 'explosion-particle';
      particle.style.setProperty('--angle', `${i * 45}deg`);
      explosion.appendChild(particle);
    }

    this.element.appendChild(explosion);

    // Remove explosion after animation
    setTimeout(() => {
      if (explosion.parentNode) {
        explosion.parentNode.removeChild(explosion);
      }
    }, 1000);
  }

  hideEasterEgg() {
    // Stop rotation
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }

    // Fade out and scale down further
    this.element.style.transition = 'all 0.5s ease-in';
    this.element.style.opacity = '0';
    this.element.style.transform = 'translate(-50%, -50%) scale(0.1) rotate(0deg)';

    // Hide element after animation
    setTimeout(() => {
      this.element.style.display = 'none';
      this.isActive = false;
    }, 500);
  }

  trackEasterEggEvent() {
    // Track easter egg trigger in Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'easter_egg_triggered', {
        event_category: 'engagement',
        event_label: 'smolderchad_easter_egg',
        value: 1,
      });
    }

    // Also track in console for development
    console.info('🎯 SMOLDERCHAD Easter Egg triggered!');
  }

  destroy() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
    }
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    document.removeEventListener('keydown', this.handleKeyPress);
    // Note: devicemotion listener is global, can't easily remove
  }
}

export default SmolderchadEasterEgg;
