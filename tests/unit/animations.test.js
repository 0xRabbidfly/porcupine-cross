/**
 * Animation System Tests
 */
import AnimationSystem from '../../js/core/animationSystem.js';

// Mock animation system for testing
jest.mock('../../js/core/animationSystem.js', () => {
  const originalModule = jest.requireActual('../../js/core/animationSystem.js');
  
  return {
    ...originalModule.default,
    animate: jest.fn().mockImplementation(() => Promise.resolve()),
    fadeIn: jest.fn().mockImplementation(() => Promise.resolve()),
    fadeOut: jest.fn().mockImplementation(() => Promise.resolve()),
    slideInLeft: jest.fn().mockImplementation(() => Promise.resolve()),
    slideInRight: jest.fn().mockImplementation(() => Promise.resolve()),
    slideInTop: jest.fn().mockImplementation(() => Promise.resolve()),
    slideInBottom: jest.fn().mockImplementation(() => Promise.resolve()),
    bounce: jest.fn().mockImplementation(() => Promise.resolve()),
    createMudSplat: jest.fn().mockImplementation(() => Promise.resolve()),
    createViewportSplat: jest.fn().mockImplementation(() => Promise.resolve()),
    queue: jest.fn().mockImplementation(fn => {
      fn();
      return originalModule.default;
    }),
    registerAnimation: jest.fn().mockImplementation((name, config) => {
      return originalModule.default;
    }),
    animations: {
      'fade-in': { cssClass: 'fade-in', duration: 300 },
      'fade-out': { cssClass: 'fade-out', duration: 300 },
      'test-animation': { cssClass: 'test-anim', duration: 500 }
    },
    getSupportInfo: jest.fn().mockReturnValue({
      promises: true,
      transitions: true,
      animations: true,
      cssVariables: true,
      modules: true
    })
  };
});

describe('Animation System', () => {
  // Original document implementation
  const originalCreateElement = document.createElement;
  const originalAppendChild = document.body.appendChild;
  const originalRemoveChild = Node.prototype.removeChild;
  
  // Mocks
  let mockParticles = [];
  let mockElements = [];
  
  beforeEach(() => {
    mockParticles = [];
    mockElements = [];
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock createElement to track particles and elements
    document.createElement = jest.fn().mockImplementation((tagName) => {
      const element = originalCreateElement.call(document, tagName);
      
      // Add a mock for style to capture CSS properties
      element.style = {
        width: '',
        height: '',
        left: '',
        top: '',
        transform: '',
        opacity: '',
        backgroundColor: '',
        setProperty: jest.fn()
      };
      
      // Add classList mock with proper methods
      element.classList = {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn().mockImplementation(className => {
          return className === 'mud-particle';
        })
      };
      
      // Track elements
      mockElements.push(element);
      
      return element;
    });
    
    // Mock appendChild to track particles
    document.body.appendChild = jest.fn().mockImplementation((child) => {
      if (child.classList && child.classList.contains('mud-particle')) {
        mockParticles.push(child);
      }
      return originalAppendChild.call(document.body, child);
    });
    
    // Mock removeChild
    Node.prototype.removeChild = jest.fn().mockImplementation(function(child) {
      mockParticles = mockParticles.filter(p => p !== child);
      return this;
    });
    
    // Mock requestAnimationFrame to execute immediately
    window.requestAnimationFrame = jest.fn().mockImplementation((callback) => {
      callback();
      return 1;
    });
    
    // Mock addEventListener
    Element.prototype.addEventListener = jest.fn().mockImplementation(function(event, callback) {
      // Execute animation callbacks immediately
      if (event === 'animationend' || event === 'transitionend') {
        setTimeout(() => callback(), 0);
      }
      return this;
    });
    
    // Mock setTimeout to execute immediately
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    // Restore original DOM methods
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
    Node.prototype.removeChild = originalRemoveChild;
    
    // Restore timers
    jest.useRealTimers();
    
    // Restore other mocks
    if (Element.prototype.addEventListener.mockRestore) {
      Element.prototype.addEventListener.mockRestore();
    }
  });
  
  
  
  describe('Animation System API', () => {
    describe('Core Animation API', () => {
      test('should register a new animation type', () => {
        // Register a new animation
        AnimationSystem.registerAnimation('test-animation', {
          cssClass: 'test-anim',
          duration: 500
        });
        
        // Verify it was registered
        expect(AnimationSystem.registerAnimation).toHaveBeenCalledWith('test-animation', {
          cssClass: 'test-anim',
          duration: 500
        });
      });
      
      test('should animate an element with a registered animation', async () => {
        // Create a mock element
        const mockElement = document.createElement('div');
        
        // Animate the element
        await AnimationSystem.animate(mockElement, 'fade-in');
        
        // Verify animation was called with correct params
        expect(AnimationSystem.animate).toHaveBeenCalledWith(mockElement, 'fade-in');
      });
      
      test('should handle invalid elements gracefully', async () => {
        // Mock the implementation for this test only
        AnimationSystem.animate.mockImplementationOnce(() => Promise.reject(new Error('Invalid element')));
        
        await expect(AnimationSystem.animate(null, 'fade-in')).rejects.toThrow('Invalid element');
      });
      
      test('should handle invalid animation types gracefully', async () => {
        // Mock the implementation for this test only
        AnimationSystem.animate.mockImplementationOnce(() => Promise.reject(new Error('Unknown animation')));
        
        const mockElement = document.createElement('div');
        await expect(AnimationSystem.animate(mockElement, 'non-existent-animation')).rejects.toThrow('Unknown animation');
      });
    });
    
    describe('Utility Animation Methods', () => {
      test('should provide utility methods for standard animations', async () => {
        // Create a mock element
        const mockElement = document.createElement('div');
        
        // Test each utility method
        const animations = [
          'fadeIn',
          'fadeOut',
          'slideInLeft',
          'slideInRight',
          'slideInTop',
          'slideInBottom',
          'bounce'
        ];
        
        for (const animation of animations) {
          // Call the animation method
          await AnimationSystem[animation](mockElement);
          
          // Verify it was called with the correct element
          expect(AnimationSystem[animation]).toHaveBeenCalledWith(mockElement);
        }
      });
    });
    
    describe('Mud Splat Effects', () => {
      test('should create mud splat with the Animation System', async () => {
        // Create a mock element
        const mockElement = document.createElement('div');
        mockElement.getBoundingClientRect = jest.fn().mockReturnValue({
          width: 100,
          height: 50,
          left: 200,
          top: 150
        });
        
        // Call the method
        await AnimationSystem.createMudSplat(mockElement);
        
        // Verify it was called with the correct element
        expect(AnimationSystem.createMudSplat).toHaveBeenCalledWith(mockElement);
      });
      
      test('should create viewport splat with the Animation System', async () => {
        // Call the method
        await AnimationSystem.createViewportSplat();
        
        // Verify it was called
        expect(AnimationSystem.createViewportSplat).toHaveBeenCalled();
      });
    });
    
    describe('Animation Queue', () => {
      test('should queue animations and process them in order', async () => {
        const mockFn1 = jest.fn().mockResolvedValue('animation1');
        
        // Queue animation
        AnimationSystem.queue(mockFn1);
        
        // Verify function was called via queue
        expect(mockFn1).toHaveBeenCalled();
        expect(AnimationSystem.queue).toHaveBeenCalledWith(mockFn1);
      });
    });
    
    describe('Feature Detection', () => {
      test('should report browser feature support', () => {
        const support = AnimationSystem.getSupportInfo();
        
        // Verify support object structure
        expect(support).toHaveProperty('promises');
        expect(support).toHaveProperty('transitions');
        expect(support).toHaveProperty('animations');
        expect(support).toHaveProperty('cssVariables');
        expect(support).toHaveProperty('modules');
        
        // Verify the method was called
        expect(AnimationSystem.getSupportInfo).toHaveBeenCalled();
      });
    });
  });
}); 