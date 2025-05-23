export function initMobileMenu(app) {
  try {
    app.components.mobileMenu = new app.MobileMenu({
      menuSelector: '#main-nav',
      toggleSelector: '#menu-toggle',
      openClass: 'open',
      transitionDuration: 500,
      animationStyle: 'default',
    });
    app.eventBus.on('mobileMenu:opened', () => {
      app.isMenuOpen = true;
    });
    app.eventBus.on('mobileMenu:closed', () => {
      app.isMenuOpen = false;
    });
    app.createMenuStyleSwitcher();
  } catch (error) {
    console.error('Error setting up mobile menu:', error);
  }
}
