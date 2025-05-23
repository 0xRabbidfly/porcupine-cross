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
  } catch (error) {
    console.error('Error setting up animation effects:', error);
  }
}
