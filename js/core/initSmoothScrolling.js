export function initSmoothScrolling(app) {
  try {
    const anchorLinks = app.getElements('a[href^="#"]');
    app.addEventListeners(anchorLinks, 'click', e => {
      e.preventDefault();
      const targetElement = document.querySelector(e.currentTarget.getAttribute('href'));
      if (targetElement) {
        const headerOffset = window.innerWidth <= 768 ? 60 : 100;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        if (window.innerWidth <= 768 && app.components.mobileMenu?.getState().isOpen) {
          setTimeout(() => {
            app.components.mobileMenu.closeMenu();
          }, 200);
          setTimeout(() => {
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth',
            });
          }, 1000);
        } else {
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      }
    });
  } catch (error) {
    console.error('Error setting up smooth scrolling:', error);
  }
}
