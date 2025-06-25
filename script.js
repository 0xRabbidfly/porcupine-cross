// Minimal legacy fallback for browsers without module support
// Modern functionality is in js/main.js

document.addEventListener('DOMContentLoaded', () => {
  // Only run if modern system is not available
  if (window.app?.components) return;

  // Essential mobile menu fallback
  const menuToggle = document.getElementById('menu-toggle');
  const mainNav = document.getElementById('main-nav');

  if (menuToggle && mainNav) {
    let isMenuOpen = false;
    menuToggle.addEventListener('click', function (e) {
      e.preventDefault();
      isMenuOpen = !isMenuOpen;
      mainNav.classList.toggle('open', isMenuOpen);
      menuToggle.classList.toggle('open', isMenuOpen);
      menuToggle.setAttribute('aria-expanded', isMenuOpen ? 'true' : 'false');
    });
  }

  // Essential smooth scrolling fallback
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetElement = document.querySelector(this.getAttribute('href'));
      if (targetElement) {
        e.preventDefault();
        const headerOffset = 100;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    });
  });
});
