import app from '../../js/main.js';
import eventBus from '../../js/core/eventBus.js';

describe('App Integration', () => {
  beforeEach(() => {
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
