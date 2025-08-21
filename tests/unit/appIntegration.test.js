/**
 * App Integration Tests
 */
import app from '../../js/main.js';
import eventBus from '../../js/core/eventBus.js';

describe('App Integration', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterAll(() => {
    console.error.mockRestore();
    console.warn.mockRestore();
  });

  beforeEach(() => {
    // Set up minimal DOM for all components
    document.body.innerHTML = `
      <button id="sound-toggle"><span id="sound-icon"></span></button>
      <audio id="click-sound"></audio>
      <audio id="crosstoberfest-sound"></audio>
      <div class="countdown-timer">
        <span id="countdown-days">00</span>:
        <span id="countdown-hours">00</span>:
        <span id="countdown-minutes">00</span>:
        <span id="countdown-seconds">00</span>
      </div>
      <div class="interactive-map-container">
        <img src="images/prologue-course-map.png" alt="Prologue Course Map" class="course-map">
        <div class="map-hotspots">
          <button class="hotspot" data-section="start-finish" aria-label="Show info for Start/Finish Line"><span class="hotspot-dot"></span></button>
        </div>
        <div class="map-info-panel">
          <button class="info-close" aria-label="Close info panel">×</button>
          <div class="info-content" id="start-finish">Start/Finish Info</div>
        </div>
      </div>
      <nav id="main-nav">
        <a href="#home">Home</a>
        <a href="#schedule">Schedule</a>
        <a href="#course">Course</a>
      </nav>
      <button id="menu-toggle" aria-label="Toggle mobile menu"></button>
    `;
    // Reset app state if needed
    if (window.app) {
      window.app.initialized = false;
      window.app.components = {};
    }
    // Clear eventBus
    eventBus.clear && eventBus.clear();
  });

  test('App exposes itself globally', () => {
    expect(window.app).toBeDefined();
    expect(window.app).toBe(app);
  });

  test('App initializes all components', () => {
    app.initialized = false;
    app.components = {};
    app.initComponents();
    expect(app.components.audioManager).toBeDefined();
    expect(app.components.countdownTimer).toBeDefined();
    expect(app.components.interactiveMap).toBeDefined();
    // Section observer and hero animation are optional DOM-dependent
  });

  test('App emits app:initialized event', () => {
    const spy = jest.fn();
    eventBus.on('app:initialized', spy);
    app.initialized = false;
    app.initComponents();
    expect(spy).toHaveBeenCalled();
  });

  test('App does not re-initialize if already initialized', () => {
    app.initialized = true;
    app.components = { foo: 'bar' };
    app.initComponents();
    expect(app.components.foo).toBe('bar');
  });
});
