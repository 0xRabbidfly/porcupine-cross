/* global clearInterval, setInterval, IntersectionObserver */

// This file remains for backwards compatibility only
// See js/main.js for the current modular implementation
// This simplified version delegates to the modern components whenever possible

// Legacy smooth scrolling for older browsers without the modular system
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    // Let the modern system handle it if available
    if (window.app && window.app.components) {
      return;
    }

    // Legacy fallback otherwise
    e.preventDefault();
    const targetElement = document.querySelector(this.getAttribute('href'));
    if (targetElement) {
      const headerOffset = 100;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  });
});

// DOMContentLoaded event with minimal legacy fallbacks
document.addEventListener('DOMContentLoaded', () => {
  console.log('script.js: Running in compatibility mode');

  // Only run legacy functionality if modern system is not available
  if (!window.app || !window.app.components) {
    console.log('script.js: Modern system not detected, using legacy fallbacks');

    // Mobile menu toggle (minimal legacy implementation)
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');

    if (menuToggle && mainNav) {
      let isMenuOpen = false;
      menuToggle.addEventListener('click', function (e) {
        e.preventDefault();
        isMenuOpen = !isMenuOpen;

        if (isMenuOpen) {
          mainNav.classList.add('open');
          menuToggle.classList.add('open');
        } else {
          mainNav.classList.remove('open');
          menuToggle.classList.remove('open');
        }

        menuToggle.setAttribute('aria-expanded', isMenuOpen ? 'true' : 'false');
      });
    }
  } else {
    console.log('script.js: Modern system detected, deferring to it');
  }
});
