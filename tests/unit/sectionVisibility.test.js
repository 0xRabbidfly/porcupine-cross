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
      rootBounds: {},
    }));
    this.callback(entries, this);
  }
}

// Save original and mock before tests
const originalIntersectionObserver = globalThis.IntersectionObserver;

describe('Section Visibility', () => {
  let mockObserver;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <main>
        <section id="home" class="hero"></section>
        <section id="schedule"></section>
        <section id="course"></section>
      </main>
      <button id="sound-toggle"><span id="sound-icon"></span></button>
      <audio id="click-sound"></audio>
      <audio id="crosstoberfest-sound"></audio>
      <div class="countdown-timer">
        <span id="countdown-days">00</span>:
        <span id="countdown-hours">00</span>:
        <span id="countdown-minutes">00</span>:
        <span id="countdown-seconds">00</span>
      </div>
      <nav id="main-nav">
        <a href="#home">Home</a>
        <a href="#schedule">Schedule</a>
        <a href="#course">Course</a>
      </nav>
      <button id="menu-toggle" aria-label="Toggle mobile menu"></button>
    `;

    // Mock IntersectionObserver
    mockObserver = null;
    globalThis.IntersectionObserver = function (callback) {
      mockObserver = new IntersectionObserverMock(callback);
      return mockObserver;
    };

    // Clear module cache to ensure fresh import
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original
    globalThis.IntersectionObserver = originalIntersectionObserver;

    // Clean up
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  test('should initialize section observer', async () => {
    // Import the app dynamically to ensure it's fresh
    await import('../../js/main.js');

    // Verify the hero section is made visible immediately
    const hero = document.getElementById('home');
    expect(hero.classList.contains('visible')).toBe(true);
    expect(hero.classList.contains('loaded')).toBe(true);

    // Verify other sections are being observed
    expect(mockObserver.elements).toHaveLength(2); // schedule and course

    // Trigger intersection for one section
    mockObserver.triggerIntersection(true);

    // Verify that observed sections become visible when they intersect
    const visibleSections = getElements('section.visible');
    expect(visibleSections).toHaveLength(3); // home (already visible) + the 2 that became visible

    // Verify that sections are unobserved after becoming visible
    expect(mockObserver.elements).toHaveLength(0);
  });

  test('should handle case with no sections gracefully', async () => {
    // Remove all sections and countdown elements to test the warning scenario
    document.body.innerHTML = `
      <main></main>
      <nav id="main-nav">
        <a href="#home">Home</a>
      </nav>
      <button id="menu-toggle" aria-label="Toggle mobile menu"></button>
    `;

    // Clear module cache to ensure fresh import
    jest.resetModules();

    // Set up console warning and error spies BEFORE importing the module
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Import app (this will trigger initialization and capture any console messages)
    await import('../../js/main.js');

    // The current code doesn't generate warnings when no sections are found
    // It just returns early gracefully. So we expect no warnings in this case.
    // This test verifies that the app doesn't crash when no sections exist.
    expect(warnSpy.mock.calls).toHaveLength(0);
    expect(errorSpy.mock.calls).toHaveLength(0);
  });

  test('should handle errors gracefully', async () => {
    // Set up a spy on console.error
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Make IntersectionObserver throw an error
    globalThis.IntersectionObserver = function () {
      throw new Error('Test error');
    };

    // Import app
    await import('../../js/main.js');

    // Verify error is logged
    expect(errorSpy).toHaveBeenCalled();
    const errorCalls = errorSpy.mock.calls.filter(call =>
      String(call[0]).includes('Error setting up section observer')
    );
    expect(errorCalls.length).toBeGreaterThan(0);
  });
});
