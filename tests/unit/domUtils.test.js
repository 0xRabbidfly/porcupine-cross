/**
 * DOM Utilities Unit Tests
 */
import * as domUtils from '../../js/utils/domUtils.js';

describe('DOM Utilities', () => {
  // Original document implementation
  const originalGetElementById = document.getElementById;
  const originalQuerySelectorAll = document.querySelectorAll;
  const originalCreateElement = document.createElement;
  
  // Mocks for testing
  let mockElement;
  let mockElementList;
  
  beforeEach(() => {
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock element with classes and dataset
    mockElement = {
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      appendChild: jest.fn(),
      className: '',
      textContent: '',
      dataset: {},
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        toggle: jest.fn().mockImplementation((className, force) => force !== undefined ? force : !mockElement.classList.contains(className)),
        contains: jest.fn().mockReturnValue(false)
      },
      addEventListener: jest.fn(),
    };
    
    // Create mock element list
    mockElementList = [
      { ...mockElement, id: 'element1', addEventListener: jest.fn() },
      { ...mockElement, id: 'element2', addEventListener: jest.fn() }
    ];
    
    // Mock document methods
    document.getElementById = jest.fn().mockImplementation(id => {
      return id === 'exists' ? mockElement : null;
    });
    
    document.querySelectorAll = jest.fn().mockImplementation(selector => {
      return selector === '.exists' ? mockElementList : [];
    });
    
    // Reset timer mocks
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    // Restore original methods
    document.getElementById = originalGetElementById;
    document.querySelectorAll = originalQuerySelectorAll;
    document.createElement = originalCreateElement;
    
    // Restore console
    console.error.mockRestore();
    
    // Restore timers
    jest.useRealTimers();
  });
  
  describe('getElement', () => {
    test('should return element when found', () => {
      const element = domUtils.getElement('exists');
      expect(element).toBe(mockElement);
    });
    
    test('should return null and not log error when element not found without error message', () => {
      const element = domUtils.getElement('not-exists');
      expect(element).toBeNull();
      expect(console.error).not.toHaveBeenCalled();
    });
    
    test('should return null and log error when element not found with error message', () => {
      const element = domUtils.getElement('not-exists', 'Custom error message');
      expect(element).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Custom error message');
    });
  });
  
  describe('getElements', () => {
    test('should return array of elements when found', () => {
      const elements = domUtils.getElements('.exists');
      expect(elements).toEqual(mockElementList);
    });
    
    test('should return empty array when no elements found', () => {
      const elements = domUtils.getElements('.not-exists');
      expect(elements).toEqual([]);
    });
    
    test('should use provided context for query', () => {
      const contextElement = {
        querySelectorAll: jest.fn().mockReturnValue([mockElement])
      };
      
      const elements = domUtils.getElements('.selector', contextElement);
      
      expect(contextElement.querySelectorAll).toHaveBeenCalledWith('.selector');
      expect(elements).toEqual([mockElement]);
    });
  });
  
  describe('addEventListeners', () => {
    test('should add event listener to single element', () => {
      const handler = jest.fn();
      
      domUtils.addEventListeners(mockElement, 'click', handler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', handler, {});
    });
    
    test('should add event listeners to all elements in array', () => {
      const handler = jest.fn();
      
      domUtils.addEventListeners(mockElementList, 'click', handler);
      
      expect(mockElementList[0].addEventListener).toHaveBeenCalledWith('click', handler, {});
      expect(mockElementList[1].addEventListener).toHaveBeenCalledWith('click', handler, {});
    });
    
    test('should pass options to addEventListener', () => {
      const handler = jest.fn();
      const options = { capture: true, once: true };
      
      domUtils.addEventListeners(mockElement, 'click', handler, options);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', handler, options);
    });
    
    test('should handle null/undefined elements gracefully', () => {
      const handler = jest.fn();
      
      expect(() => {
        domUtils.addEventListeners(null, 'click', handler);
      }).not.toThrow();
      
      expect(() => {
        domUtils.addEventListeners(undefined, 'click', handler);
      }).not.toThrow();
    });
  });
  
  describe('toggleClass', () => {
    test('should toggle class on element', () => {
      domUtils.toggleClass(mockElement, 'active');
      
      expect(mockElement.classList.toggle).toHaveBeenCalledWith('active', undefined);
    });
    
    test('should force add class when force is true', () => {
      domUtils.toggleClass(mockElement, 'active', true);
      
      expect(mockElement.classList.toggle).toHaveBeenCalledWith('active', true);
    });
    
    test('should force remove class when force is false', () => {
      domUtils.toggleClass(mockElement, 'active', false);
      
      expect(mockElement.classList.toggle).toHaveBeenCalledWith('active', false);
    });
    
    test('should handle null element gracefully', () => {
      const result = domUtils.toggleClass(null, 'active');
      
      expect(result).toBe(false);
    });
  });
  
  describe('addTemporaryClass', () => {
    test('should add class immediately and remove after delay', () => {
      domUtils.addTemporaryClass(mockElement, 'flash', 1000);
      
      expect(mockElement.classList.add).toHaveBeenCalledWith('flash');
      
      // Class should still be there before timeout
      expect(mockElement.classList.remove).not.toHaveBeenCalled();
      
      // Fast-forward time
      jest.advanceTimersByTime(1000);
      
      expect(mockElement.classList.remove).toHaveBeenCalledWith('flash');
    });
    
    test('should handle null element gracefully', () => {
      expect(() => {
        domUtils.addTemporaryClass(null, 'flash', 1000);
      }).not.toThrow();
      
      jest.advanceTimersByTime(1000);
    });
  });
}); 