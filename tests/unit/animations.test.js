/**
 * Animation System Tests
 * Tests the core animation functionality and API
 */
import AnimationSystem from '../../js/core/animationSystem.js';

describe('Animation System', () => {
  let mockElement;

  beforeEach(() => {
    // Create a simple mock element for testing
    mockElement = document.createElement('div');
    mockElement.classList = {
      add: jest.fn(),
      remove: jest.fn(),
    };
    mockElement.style = {
      setProperty: jest.fn(),
    };

    // Mock getBoundingClientRect for mud splat tests
    mockElement.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 100,
      height: 50,
      left: 200,
      top: 150,
    });

    // Mock window properties
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  describe('Animation Registration', () => {
    test('should register new animation types', () => {
      const newAnimation = {
        cssClass: 'test-anim',
        duration: 500,
      };

      AnimationSystem.registerAnimation('test-animation', newAnimation);

      expect(AnimationSystem.animations['test-animation']).toEqual(newAnimation);
    });

    test('should reject invalid animation names', () => {
      const result = AnimationSystem.registerAnimation('', { cssClass: 'test' });
      expect(result).toBe(AnimationSystem);
    });
  });

  describe('Animation System Properties', () => {
    test('should have standard animation types', () => {
      expect(AnimationSystem.animations).toHaveProperty('fade-in');
      expect(AnimationSystem.animations).toHaveProperty('fade-out');
      expect(AnimationSystem.animations).toHaveProperty('slide-in-left');
      expect(AnimationSystem.animations).toHaveProperty('slide-in-right');
      expect(AnimationSystem.animations).toHaveProperty('slide-in-top');
      expect(AnimationSystem.animations).toHaveProperty('slide-in-bottom');
      expect(AnimationSystem.animations).toHaveProperty('bounce');
      expect(AnimationSystem.animations).toHaveProperty('mud-splat');
      expect(AnimationSystem.animations).toHaveProperty('mud-splat-viewport');
    });

    test('should have utility methods', () => {
      expect(typeof AnimationSystem.fadeIn).toBe('function');
      expect(typeof AnimationSystem.fadeOut).toBe('function');
      expect(typeof AnimationSystem.slideInLeft).toBe('function');
      expect(typeof AnimationSystem.slideInRight).toBe('function');
      expect(typeof AnimationSystem.slideInTop).toBe('function');
      expect(typeof AnimationSystem.slideInBottom).toBe('function');
      expect(typeof AnimationSystem.bounce).toBe('function');
      expect(typeof AnimationSystem.createMudSplat).toBe('function');
      expect(typeof AnimationSystem.createViewportSplat).toBe('function');
      expect(typeof AnimationSystem.queue).toBe('function');
      expect(typeof AnimationSystem.cancelAnimations).toBe('function');
      expect(typeof AnimationSystem.getSupportInfo).toBe('function');
    });
  });

  describe('Feature Detection', () => {
    test('should report browser support information', () => {
      const support = AnimationSystem.getSupportInfo();

      expect(support).toHaveProperty('promises');
      expect(support).toHaveProperty('transitions');
      expect(support).toHaveProperty('animations');
      expect(support).toHaveProperty('cssVariables');
      expect(support).toHaveProperty('modules');
    });
  });

  describe('Animation Management', () => {
    test('should handle canceling animations gracefully', () => {
      const result = AnimationSystem.cancelAnimations(mockElement);
      expect(result).toBe(AnimationSystem);
    });

    test('should handle canceling animations on null elements', () => {
      const result = AnimationSystem.cancelAnimations(null);
      expect(result).toBe(AnimationSystem);
    });
  });

  describe('Animation Queue', () => {
    test('should handle queue operations', () => {
      const mockFn = jest.fn();
      const result = AnimationSystem.queue(mockFn);
      expect(result).toBe(AnimationSystem);
    });

    test('should handle invalid queue items gracefully', () => {
      const result = AnimationSystem.queue('not a function');
      expect(result).toBe(AnimationSystem);
    });
  });
});
