export function initHeroAnimation(app) {
  try {
    const heroSection = app.getElement('home');
    if (heroSection) {
      app.AnimationSystem.animate(heroSection, 'fade-in', {
        duration: 500,
        variables: { '--hero-opacity': '1' },
      });
    }
  } catch (error) {
    console.error('Error setting up hero animation:', error);
  }
}
