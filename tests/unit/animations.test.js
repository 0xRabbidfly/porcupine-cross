/**
 * Animation Utilities Tests
 */
import { createMudSplat, createViewportWideMudSplat } from '../../js/utils/animationUtils.js';

describe('Animation Utilities', () => {
  // Original document implementation
  const originalCreateElement = document.createElement;
  const originalAppendChild = document.body.appendChild;
  const originalRemoveChild = Node.prototype.removeChild;
  
  // Mocks
  let mockParticles = [];
  
  beforeEach(() => {
    mockParticles = [];
    
    // Mock createElement to track particles
    document.createElement = jest.fn().mockImplementation((tagName) => {
      const element = originalCreateElement.call(document, tagName);
      
      // Add a mock for style to capture CSS transforms
      element.style = {
        width: '',
        height: '',
        left: '',
        top: '',
        transform: '',
        opacity: '',
        backgroundColor: ''
      };
      
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
  });
  
  describe('createMudSplat', () => {
    test('should create particles when an element is clicked', () => {
      // Create a mock element with getBoundingClientRect
      const mockElement = document.createElement('button');
      mockElement.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 100,
        height: 50,
        left: 200,
        top: 150
      });
      
      // Call the function
      const result = createMudSplat(mockElement);
      
      // Verify particles were created
      expect(result).toBe(true);
      expect(mockParticles.length).toBeGreaterThan(0);
      
      // Verify document.createElement was called
      expect(document.createElement).toHaveBeenCalledWith('div');
      
      // Verify particles were added to the body
      expect(document.body.appendChild).toHaveBeenCalled();
      
      // Run timers to trigger cleanup
      jest.runAllTimers();
      
      // Verify particles are cleaned up
      expect(Node.prototype.removeChild).toHaveBeenCalled();
    });
    
    test('should handle null elements gracefully', () => {
      const result = createMudSplat(null);
      expect(result).toBe(false);
      expect(mockParticles.length).toBe(0);
    });
    
    test('should handle errors gracefully', () => {
      // Create a mock element that will cause an error
      const mockElement = {};
      
      // Add a console.error spy
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the function
      const result = createMudSplat(mockElement);
      
      // Verify error was handled
      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalled();
      
      // Clean up
      errorSpy.mockRestore();
    });
  });
  
  describe('createViewportWideMudSplat', () => {
    test('should create particles across the viewport', () => {
      // Mock window dimensions
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
      
      // Call the function
      const result = createViewportWideMudSplat();
      
      // Verify particles were created
      expect(result).toBe(true);
      expect(mockParticles.length).toBeGreaterThan(0);
      
      // Verify document.createElement was called
      expect(document.createElement).toHaveBeenCalledWith('div');
      
      // Verify particles were added to the body
      expect(document.body.appendChild).toHaveBeenCalled();
      
      // Run timers to trigger transformations and cleanup
      jest.advanceTimersByTime(10);
      expect(mockParticles[0].style.transform).toContain('translate');
      
      jest.runAllTimers();
      
      // Verify particles are cleaned up
      expect(Node.prototype.removeChild).toHaveBeenCalled();
    });
    
    test('should handle errors gracefully', () => {
      // Make document.createElement throw an error
      document.createElement = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      // Add a console.error spy
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the function
      const result = createViewportWideMudSplat();
      
      // Verify error was handled
      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalled();
      
      // Clean up
      errorSpy.mockRestore();
    });
  });
}); 