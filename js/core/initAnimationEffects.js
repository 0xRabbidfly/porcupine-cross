/**
 * Initialize Animation Effects
 * Enhanced version with experimental animations
 */

export function initAnimationEffects(app) {
  try {
    app.initMobileMenu();
    const ctaButtons = app.getElements('.cta-button');
    app.addEventListeners(ctaButtons, 'click', event => {
      app.AnimationSystem.createMudSplat(event.currentTarget);
      if (app.components.audioManager) {
        app.components.audioManager.playClickSound();
      }
    });
    const desktopNavLinks = app.getElements('nav#main-nav a');
    app.addEventListeners(desktopNavLinks, 'click', event => {
      if (!event.isTrusted) return;
      if (window.innerWidth <= 768 && app.components.mobileMenu?.getState().isOpen) {
        app.AnimationSystem.createViewportSplat({ mobile: true });
      } else if (window.innerWidth > 768) {
        app.AnimationSystem.createMudSplat(event.currentTarget);
      }
      if (app.components.audioManager) {
        app.components.audioManager.playClickSound();
      }
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([10, 30, 10]);
      }
    });

    // Initialize flipping letters for PROLOGUE title
    setTimeout(() => {
      initFlippingTitle();
      // Ensure hero section is marked as loaded for ace icons
      const heroSection = document.querySelector('.hero');
      if (heroSection) {
        heroSection.classList.add('loaded');
      }
    }, 500); // Small delay to ensure DOM is ready

    // Enhanced click animations
    document.addEventListener('click', e => {
      if (e.target.closest('.cta-button, .menu-icon, .countdown-item')) {
        app.components.audioManager.playClickSound();
        createClickRipple(e);
      }
    });

    // Enhanced hover effects for interactive elements
    const interactiveElements = document.querySelectorAll('.countdown-item, .cta-button, .hotspot');
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        element.style.transform += ' scale(1.05)';
      });
      element.addEventListener('mouseleave', () => {
        element.style.transform = element.style.transform.replace(' scale(1.05)', '');
      });
    });
  } catch (error) {
    console.error('Error setting up animation effects:', error);
  }
}

function initOrbitingIcons() {
  const heroSection = document.querySelector('.hero');
  const heroCopySide = document.querySelector('.hero-copy-side');

  if (!heroSection || !heroCopySide) {
    console.log('Hero section or copy side not found for orbiting icons');
    return;
  }

  // Available suits and their colors
  const suits = [
    { symbol: '♠', color: '#000000' }, // Spade - black
    { symbol: '♣', color: '#000000' }, // Club - black
    { symbol: '♥', color: '#e73e3a' }, // Heart - red
    { symbol: '♦', color: '#e73e3a' }, // Diamond - red
  ];

  // Set random suits and colors for the orbiting icons
  const randomSuit1 = suits[Math.floor(Math.random() * suits.length)];
  const randomSuit2 = suits[Math.floor(Math.random() * suits.length)];

  // Apply the random suits via CSS custom properties
  heroCopySide.style.setProperty('--orbit-suit-1', `"${randomSuit1.symbol}"`);
  heroCopySide.style.setProperty('--orbit-color-1', randomSuit1.color);
  heroCopySide.style.setProperty('--orbit-suit-2', `"${randomSuit2.symbol}"`);
  heroCopySide.style.setProperty('--orbit-color-2', randomSuit2.color);

  console.log(
    'Orbiting icons initialized with random suits:',
    randomSuit1.symbol,
    randomSuit2.symbol
  );
}

function initFlippingTitle() {
  const titleElement = document.querySelector('.prologue-card-title');
  if (!titleElement) {
    console.log('Prologue title element not found');
    return;
  }

  const titleText = titleElement.textContent.trim();
  console.log('Found title text:', titleText);
  titleElement.innerHTML = '';

  // Available suits and their colors
  const suits = [
    { symbol: '♠', color: '#000000' }, // Spade - black
    { symbol: '♣', color: '#000000' }, // Club - black
    { symbol: '♥', color: '#e73e3a' }, // Heart - red
    { symbol: '♦', color: '#e73e3a' }, // Diamond - red
  ];

  // Create flipping letter structure
  titleText.split('').forEach((letter, index) => {
    if (letter === ' ') {
      titleElement.appendChild(document.createTextNode(' '));
      return;
    }

    // Pick a random suit for this letter
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];

    const letterContainer = document.createElement('span');
    letterContainer.className = 'flip-letter';

    const letterFront = document.createElement('span');
    letterFront.className = 'letter-front';
    letterFront.textContent = letter;

    const letterBack = document.createElement('span');
    letterBack.className = 'letter-back';
    letterBack.textContent = randomSuit.symbol;
    letterBack.style.color = randomSuit.color;

    letterContainer.appendChild(letterFront);
    letterContainer.appendChild(letterBack);
    titleElement.appendChild(letterContainer);
  });

  console.log('Flipping letters initialized with random suits and colors');
}

function createClickRipple(e) {
  const ripple = document.createElement('div');
  ripple.style.cssText = `
    position: fixed;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, transparent 70%);
    transform: scale(0);
    animation: ripple-effect 0.6s ease-out;
    pointer-events: none;
    z-index: 9999;
    width: 100px;
    height: 100px;
    left: ${e.clientX - 50}px;
    top: ${e.clientY - 50}px;
  `;

  document.body.appendChild(ripple);

  // Add ripple animation keyframes if not already added
  if (!document.querySelector('#ripple-keyframes')) {
    const style = document.createElement('style');
    style.id = 'ripple-keyframes';
    style.textContent = `
      @keyframes ripple-effect {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => ripple.remove(), 600);
}
