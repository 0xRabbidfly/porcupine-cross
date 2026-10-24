/**
 * Mobile Menu Tests
 */
// No longer need to import JSDOM directly since Jest uses jsdom environment

// Import MobileMenu component
import MobileMenu from '../../js/components/mobileMenu.js';
import eventBus from '../../js/core/eventBus.js';

// Mock eventBus
jest.mock('../../js/core/eventBus.js', () => ({
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
}));

// Setup DOM for tests
let document;
let window;
let mobileMenu;
let mockMenuToggle;
let mockMainNav;
let mockDocument;

// Mock the animation system
global.AnimationSystem = {
  createViewportSplat: jest.fn().mockReturnValue(Promise.resolve()),
};

// Mock the app with audio manager
global.app = {
  components: {
    audioManager: {
      playClickSound: jest.fn(),
    },
  },
};

// Mock setTimeout to execute immediately in tests
jest.useFakeTimers();

// Mock for utils
jest.mock('../../js/utils/domUtils.js', () => ({
  getElement: jest.fn(id => mockDocument?.getElementById(id) || null),
  getElements: jest.fn(() => []),
  addEventListeners: jest.fn(),
}));

describe('Mobile Menu Functionality', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup global references
    document = global.document;
    window = global.window;
    mockDocument = document;

    // Create a basic HTML structure for the mobile menu
    document.body.innerHTML = `
      <header>
        <button type="button" id="menu-toggle" aria-label="Menu">
          <span class="hamburger"></span>
        </button>
        <nav id="main-nav">
          <a href="#home">Home</a>
          <a href="#schedule">Schedule</a>
          <a href="#course">Course</a>
          <a href="docs/Prologue Cross Technical Guide.pdf" target="_blank">Tech Guide</a>
          <a href="#" id="sound-toggle" class="sound-control" aria-label="Toggle Sound">
            <i id="sound-icon" class="fa fa-volume-up"></i>
          </a>
        </nav>
      </header>
    `;

    // Set window size
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

    // Mock requestAnimationFrame and navigator.vibrate
    window.requestAnimationFrame = jest.fn(cb => cb());
    window.navigator = { vibrate: jest.fn() };

    // Initialize elements for testing
    mockMenuToggle = document.getElementById('menu-toggle');
    mockMainNav = document.getElementById('main-nav');

    // Create mobile menu instance
    mobileMenu = new MobileMenu();

    // Reset the state to ensure clean test state
    mobileMenu.resetState();
  });

  afterEach(() => {
    mobileMenu.destroy();
    jest.clearAllMocks();
    document.body.innerHTML = '';
    mockDocument = null;
    mockMenuToggle = null;
    mockMainNav = null;
    mobileMenu = null;
  });

  test('menu should open and close', () => {
    // Verify initial state
    expect(mobileMenu.state.isOpen).toBe(false);
    expect(mockMainNav.classList.contains('open')).toBe(false);

    // Mock non-animated state for testing
    mobileMenu._forceState({ isAnimating: false });

    // Open the menu directly
    mobileMenu.openMenu();

    // Menu should now be open
    expect(mobileMenu.state.isOpen).toBe(true);
    expect(mockMainNav.classList.contains('open')).toBe(true);
    expect(mockMenuToggle.classList.contains('open')).toBe(true);
    expect(mockMenuToggle.getAttribute('aria-expanded')).toBe('true');
    expect(eventBus.emit).toHaveBeenCalledWith('mobileMenu:opened', { isAnimating: true });

    // Reset animation state for testing
    mobileMenu._forceState({ isAnimating: false });

    // Close the menu directly
    mobileMenu.closeMenu();

    // Menu should now be closed
    expect(mobileMenu.state.isOpen).toBe(false);
    expect(mockMainNav.classList.contains('open')).toBe(false);
    expect(mockMenuToggle.classList.contains('open')).toBe(false);
    expect(mockMenuToggle.getAttribute('aria-expanded')).toBe('false');
    expect(eventBus.emit).toHaveBeenCalledWith('mobileMenu:closed', { isAnimating: true });
  });

  test('menu should toggle state', () => {
    // Reset to ensure clean state
    mobileMenu.resetState();
    mobileMenu._forceState({ isAnimating: false });

    // Initial state is closed
    expect(mobileMenu.state.isOpen).toBe(false);

    // Toggle to open
    mobileMenu.toggleMenu();
    expect(mobileMenu.state.isOpen).toBe(true);
    expect(eventBus.emit).toHaveBeenCalledWith('mobileMenu:opened', { isAnimating: true });

    // Reset animation state
    mobileMenu._forceState({ isAnimating: false });

    // Toggle to closed
    mobileMenu.toggleMenu();
    expect(mobileMenu.state.isOpen).toBe(false);
    expect(eventBus.emit).toHaveBeenCalledWith('mobileMenu:closed', { isAnimating: true });
  });

  test('clicking toggle should change menu state', () => {
    // Reset to ensure clean state
    mobileMenu.resetState();
    mobileMenu._forceState({ isAnimating: false });

    // Simulate the toggle click handler
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    };

    mobileMenu.handleToggleClick(mockEvent);

    // Run the setTimeout immediately
    jest.runAllTimers();

    // Menu should now be open
    expect(mobileMenu.state.isOpen).toBe(true);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(eventBus.emit).toHaveBeenCalledWith('mobileMenu:opened', { isAnimating: true });

    // Reset animation state
    mobileMenu._forceState({ isAnimating: false });

    // Click toggle again
    mobileMenu.handleToggleClick(mockEvent);

    // Run the setTimeout immediately
    jest.runAllTimers();

    // Menu should now be closed
    expect(mobileMenu.state.isOpen).toBe(false);
    expect(eventBus.emit).toHaveBeenCalledWith('mobileMenu:closed', { isAnimating: true });
  });

  test('transition end should clear animating state', () => {
    // Set animating state and open state
    mobileMenu._forceState({ isAnimating: true, isOpen: true });

    // Trigger transition end
    mobileMenu.handleTransitionEnd();

    // Animation state should be cleared
    expect(mobileMenu.state.isAnimating).toBe(false);
    expect(eventBus.emit).toHaveBeenCalledWith('mobileMenu:transitionComplete', { isOpen: true });

    // Test with closed state
    mobileMenu._forceState({ isAnimating: true, isOpen: false });

    // Trigger transition end
    mobileMenu.handleTransitionEnd();

    // Animation state should be cleared
    expect(mobileMenu.state.isAnimating).toBe(false);
    expect(eventBus.emit).toHaveBeenCalledWith('mobileMenu:transitionComplete', { isOpen: false });
  });

  test('document click should close open menu', () => {
    // Set menu to open state
    mobileMenu._forceState({ isAnimating: false, isOpen: true });
    mockMainNav.classList.add('open');

    // Simulate click outside menu
    const outsideClickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });

    document.body.dispatchEvent(outsideClickEvent);

    // Menu should be closed
    expect(mobileMenu.state.isOpen).toBe(false);
    expect(mockMainNav.classList.contains('open')).toBe(false);
    expect(eventBus.emit).toHaveBeenCalledWith('mobileMenu:closed', { isAnimating: true });
  });

  test('Escape closes the open menu and returns focus to the toggle', () => {
    mobileMenu._forceState({ isAnimating: false });
    mobileMenu.openMenu();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(mobileMenu.state.isOpen).toBe(false);
    expect(mockMenuToggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(mockMenuToggle);
  });

  test('Escape does nothing while the menu is closed', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(eventBus.emit).not.toHaveBeenCalledWith('mobileMenu:closed', { isAnimating: true });
  });

  test('on a phone a menu link closes the menu, then goes to its section once', () => {
    jest.useFakeTimers();
    const width = window.innerWidth;
    window.innerWidth = 390;
    const section = document.createElement('section');
    section.id = 'schedule';
    section.scrollIntoView = jest.fn();
    document.body.appendChild(section);
    try {
      window.location.hash = '';
      mobileMenu._forceState({ isOpen: true, isAnimating: false });
      mockMainNav.querySelector('a[href="#schedule"]').click();
      expect(window.location.hash).toBe('');
      jest.advanceTimersByTime(1000);
      expect(mobileMenu.state.isOpen).toBe(false);
      expect(window.location.hash).toBe('#schedule');

      // Already at that address: the hash would not move, so it scrolls.
      mockMainNav.querySelector('a[href="#schedule"]').click();
      jest.advanceTimersByTime(1000);
      expect(section.scrollIntoView).toHaveBeenCalledTimes(1);
    } finally {
      window.innerWidth = width;
      window.location.hash = '';
      jest.useRealTimers();
    }
  });

  test('destroy removes the toggle and keyboard listeners', () => {
    jest.useFakeTimers();
    mobileMenu.destroy();

    mockMenuToggle.click();
    jest.advanceTimersByTime(50);
    expect(mobileMenu.state.isOpen).toBe(false);

    mobileMenu._forceState({ isOpen: true, isAnimating: false });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(mobileMenu.state.isOpen).toBe(true);
    jest.useRealTimers();
  });
});
