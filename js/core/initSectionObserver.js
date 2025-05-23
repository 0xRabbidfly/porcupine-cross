/* global IntersectionObserver */
export function initSectionObserver(app) {
  try {
    const { getElements, getElement } = app;
    const sections = getElements('section');
    if (sections.length === 0) return;
    const heroSection = getElement('home');
    if (heroSection) {
      heroSection.classList.add('visible');
      heroSection.classList.add('loaded');
    }
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };
    const sectionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
          app.eventBus.emit('section:visible', {
            id: entry.target.id,
            element: entry.target,
          });
        }
      });
    }, observerOptions);
    sections.forEach(section => {
      if (section.id !== 'home') {
        sectionObserver.observe(section);
      }
    });
    app.components.sectionObserver = sectionObserver;
  } catch (error) {
    console.error('Error setting up section observer:', error);
  }
}
