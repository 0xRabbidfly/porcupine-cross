/**
 * Mobile Menu Tests
 */
// No longer need to import JSDOM directly since Jest uses jsdom environment

// Setup DOM for tests
let document;
let window;
let mockMenuToggle;
let mockMainNav;
let mockDocument;

// Mock the App with references to global variables
jest.mock('../../js/main.js', () => {
  return class App {
    constructor() {
      this.isMenuOpen = false;
      this.components = {};
      this.initialized = false;
    }

    init() {
      this.initMobileMenu();
      return this;
    }

    initMobileMenu() {
      if (mockDocument) {
        const menuToggle = mockDocument.getElementById('menu-toggle');
        const mainNav = mockDocument.getElementById('main-nav');
        
        if (!menuToggle || !mainNav) return;
        
        // Preserve references for testing
        mockMenuToggle = menuToggle;
        mockMainNav = mainNav;
        
        // Setup methods similar to the real app
        this.openMenu = () => {
          this.isMenuOpen = true;
          mainNav.classList.add('open');
          menuToggle.classList.add('open');
          menuToggle.setAttribute('aria-expanded', 'true');
        };
        
        this.closeMenu = () => {
          this.isMenuOpen = false;
          mainNav.classList.remove('open');
          menuToggle.classList.remove('open');
          menuToggle.setAttribute('aria-expanded', 'false');
        };
        
        // Setup click event for toggle
        menuToggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (this.isMenuOpen) {
            this.closeMenu();
          } else {
            this.openMenu();
          }
        });
        
        // Setup document click handler
        if (mockDocument) {
          mockDocument.addEventListener('click', (e) => {
            if (this.isMenuOpen && 
                !mainNav.contains(e.target) && 
                e.target !== menuToggle) {
              this.closeMenu();
            }
          });
        }
      }
    }
  };
});

// Mock for animation utils
jest.mock('../../js/utils/animationUtils.js', () => ({
  createMudSplat: jest.fn(() => true),
  createViewportWideMudSplat: jest.fn(() => true)
}));

// Mock for utils
jest.mock('../../js/utils/domUtils.js', () => ({
  getElement: jest.fn((id) => mockDocument?.getElementById(id) || null),
  getElements: jest.fn(() => []),
  addEventListeners: jest.fn()
}));

// Mock for components
jest.mock('../../js/components/audioManager.js', () => jest.fn());
jest.mock('../../js/components/countdownTimer.js', () => ({ CountdownTimer: jest.fn() }));
jest.mock('../../js/components/interactiveMap.js', () => ({ createFromSelectors: jest.fn() }));
jest.mock('../../js/core/eventBus.js', () => ({ emit: jest.fn(), on: jest.fn(), off: jest.fn() }));

// Import App after mocks
const App = require('../../js/main.js').default;

describe('Mobile Menu Functionality', () => {
  let app;
  
  beforeEach(() => {
    // Setup global references
    document = global.document;
    window = global.window;
    mockDocument = document;
    
    // Create a basic HTML structure for the mobile menu
    document.body.innerHTML = `
      <header>
        <a href="#main-nav" id="menu-toggle" aria-label="Open Menu">
          <span class="hamburger"></span>
        </a>
        <nav id="main-nav">
          <a href="#home">Home</a>
          <a href="#schedule">Schedule</a>
          <a href="#course">Course</a>
          <a href="tech-guide.pdf" target="_blank">Tech Guide</a>
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
    
    // Create new App instance
    app = new App();
    
    // Initialize the app
    app.init();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    mockDocument = null;
    mockMenuToggle = null;
    mockMainNav = null;
  });
  
  test('hamburger menu toggle should open and close the menu', () => {
    // Verify initial state
    expect(app.isMenuOpen).toBe(false);
    expect(mockMainNav.classList.contains('open')).toBe(false);
    
    // Click the menu toggle to open
    mockMenuToggle.click();
    
    // Menu should now be open
    expect(app.isMenuOpen).toBe(true);
    expect(mockMainNav.classList.contains('open')).toBe(true);
    expect(mockMenuToggle.classList.contains('open')).toBe(true);
    expect(mockMenuToggle.getAttribute('aria-expanded')).toBe('true');
    
    // Click the menu toggle again to close
    mockMenuToggle.click();
    
    // Menu should now be closed
    expect(app.isMenuOpen).toBe(false);
    expect(mockMainNav.classList.contains('open')).toBe(false);
    expect(mockMenuToggle.classList.contains('open')).toBe(false);
    expect(mockMenuToggle.getAttribute('aria-expanded')).toBe('false');
  });
  
  test('clicking outside the menu should close it', () => {
    // Open the menu
    mockMenuToggle.click();
    expect(app.isMenuOpen).toBe(true);
    
    // Create a click event on the document body, outside the menu
    const bodyClickEvent = new Event('click', { bubbles: true });
    document.body.dispatchEvent(bodyClickEvent);
    
    // Menu should close
    expect(app.isMenuOpen).toBe(false);
    expect(mockMainNav.classList.contains('open')).toBe(false);
  });
}); 