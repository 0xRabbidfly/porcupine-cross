/**
 * Section Visibility Tests
 */
import { getElements } from '../../js/utils/domUtils.js';

// Mock IntersectionObserver
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
    this.elements = [];
  }

  observe(element) {
    this.elements.push(element);
  }

  unobserve(element) {
    this.elements = this.elements.filter(el => el !== element);
  }

  // Trigger intersection for testing
  triggerIntersection(isIntersecting) {
    const entries = this.elements.map(element => ({
      isIntersecting,
      target: element,
      boundingClientRect: {},
      intersectionRatio: isIntersecting ? 0.5 : 0,
      intersectionRect: {},
      rootBounds: {}
    }));
    this.callback(entries, this);
  }
}

// Save original and mock before tests
const originalIntersectionObserver = global.IntersectionObserver;

describe('Section Visibility', () => {
  let app;
  let mockObserver;
  
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <main>
        <section id="home" class="hero"></section>
        <section id="schedule"></section>
        <section id="course"></section>
      </main>
    `;
    
    // Mock IntersectionObserver
    mockObserver = null;
    global.IntersectionObserver = function(callback, options) {
      mockObserver = new IntersectionObserverMock(callback);
      return mockObserver;
    };
    
    // Clear module cache to ensure fresh import
    jest.resetModules();
  });
  
  afterEach(() => {
    // Restore original
    global.IntersectionObserver = originalIntersectionObserver;
    
    // Clean up
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });
  
  test('should initialize section observer', async () => {
    // Import the app dynamically to ensure it's fresh
    app = (await import('../../js/main.js')).default;
    
    // Verify the hero section is made visible immediately
    const hero = document.getElementById('home');
    expect(hero.classList.contains('visible')).toBe(true);
    expect(hero.classList.contains('loaded')).toBe(true);
    
    // Verify other sections are being observed
    expect(mockObserver.elements.length).toBe(2); // schedule and course
    
    // Trigger intersection for one section
    mockObserver.triggerIntersection(true);
    
    // Verify that observed sections become visible when they intersect
    const visibleSections = getElements('section.visible');
    expect(visibleSections.length).toBe(3); // home (already visible) + the 2 that became visible
    
    // Verify that sections are unobserved after becoming visible
    expect(mockObserver.elements.length).toBe(0);
  });
  
  test('should handle case with no sections gracefully', async () => {
    // Remove all sections
    document.body.innerHTML = '<main></main>';
    
    // Set up console warning spy
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Import app
    app = (await import('../../js/main.js')).default;
    
    // Verify warning is shown
    expect(warnSpy).toHaveBeenCalledWith('No sections found to observe');
  });
  
  test('should handle errors gracefully', async () => {
    // Set up a spy on console.error
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Make IntersectionObserver throw an error
    global.IntersectionObserver = function() {
      throw new Error('Test error');
    };
    
    // Import app
    app = (await import('../../js/main.js')).default;
    
    // Verify error is logged
    expect(errorSpy).toHaveBeenCalled();
    const errorCalls = errorSpy.mock.calls.filter(call => 
      String(call[0]).includes('Error setting up section observer')
    );
    expect(errorCalls.length).toBeGreaterThan(0);
  });
}); 