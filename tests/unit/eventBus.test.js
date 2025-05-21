/**
 * Event Bus Unit Tests
 */
import eventBus from '../../js/core/eventBus.js';

describe('EventBus', () => {
  beforeEach(() => {
    // Clear all events before each test
    eventBus.clear();
    
    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore console.error
    console.error.mockRestore();
  });
  
  describe('on', () => {
    test('should subscribe to an event', () => {
      const callback = jest.fn();
      eventBus.on('test-event', callback);
      
      eventBus.emit('test-event');
      
      expect(callback).toHaveBeenCalled();
    });
    
    test('should return an unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = eventBus.on('test-event', callback);
      
      unsubscribe();
      eventBus.emit('test-event');
      
      expect(callback).not.toHaveBeenCalled();
    });
    
    test('should support multiple subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      eventBus.on('test-event', callback1);
      eventBus.on('test-event', callback2);
      
      eventBus.emit('test-event');
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });
  
  describe('once', () => {
    test('should subscribe to an event only once', () => {
      const callback = jest.fn();
      eventBus.once('test-event', callback);
      
      eventBus.emit('test-event');
      eventBus.emit('test-event');
      
      expect(callback).toHaveBeenCalledTimes(1);
    });
    
    test('should return an unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = eventBus.once('test-event', callback);
      
      unsubscribe();
      eventBus.emit('test-event');
      
      expect(callback).not.toHaveBeenCalled();
    });
    
    test('should pass arguments to callback', () => {
      const callback = jest.fn();
      eventBus.once('test-event', callback);
      
      const testData = { foo: 'bar' };
      eventBus.emit('test-event', testData, 'baz');
      
      expect(callback).toHaveBeenCalledWith(testData, 'baz');
    });
  });
  
  describe('off', () => {
    test('should unsubscribe from an event', () => {
      const callback = jest.fn();
      eventBus.on('test-event', callback);
      
      eventBus.off('test-event', callback);
      eventBus.emit('test-event');
      
      expect(callback).not.toHaveBeenCalled();
    });
    
    test('should handle non-existent events gracefully', () => {
      const callback = jest.fn();
      
      // This should not throw
      expect(() => {
        eventBus.off('non-existent-event', callback);
      }).not.toThrow();
    });
    
    test('should clean up empty event arrays', () => {
      const callback = jest.fn();
      eventBus.on('test-event', callback);
      
      eventBus.off('test-event', callback);
      
      // Access internal property for testing
      expect(eventBus.events['test-event']).toBeUndefined();
    });
    
    test('should clean up once callbacks', () => {
      const callback = jest.fn();
      eventBus.once('test-event', callback);
      
      // Get the wrapped callback (not possible in real usage, but useful for testing)
      const wrappedCallback = eventBus.events['test-event'][0];
      
      eventBus.off('test-event', wrappedCallback);
      
      // Access internal property for testing
      expect(eventBus.onceCallbacks.size).toBe(0);
    });
  });
  
  describe('emit', () => {
    test('should call all subscribed callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      eventBus.on('test-event', callback1);
      eventBus.on('test-event', callback2);
      
      eventBus.emit('test-event');
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
    
    test('should pass arguments to callbacks', () => {
      const callback = jest.fn();
      eventBus.on('test-event', callback);
      
      const testData = { foo: 'bar' };
      eventBus.emit('test-event', testData, 'baz');
      
      expect(callback).toHaveBeenCalledWith(testData, 'baz');
    });
    
    test('should handle non-existent events gracefully', () => {
      // This should not throw
      expect(() => {
        eventBus.emit('non-existent-event');
      }).not.toThrow();
    });
    
    test('should catch errors in callbacks', () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      eventBus.on('test-event', errorCallback);
      
      // This should not throw
      expect(() => {
        eventBus.emit('test-event');
      }).not.toThrow();
      
      expect(console.error).toHaveBeenCalled();
    });
    
    test('should continue executing callbacks even if one fails', () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const successCallback = jest.fn();
      
      eventBus.on('test-event', errorCallback);
      eventBus.on('test-event', successCallback);
      
      eventBus.emit('test-event');
      
      expect(errorCallback).toHaveBeenCalled();
      expect(successCallback).toHaveBeenCalled();
    });
  });
  
  describe('clear', () => {
    test('should clear all events when no event specified', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      eventBus.on('event1', callback1);
      eventBus.on('event2', callback2);
      
      eventBus.clear();
      
      eventBus.emit('event1');
      eventBus.emit('event2');
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
    
    test('should clear only specified event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      eventBus.on('event1', callback1);
      eventBus.on('event2', callback2);
      
      eventBus.clear('event1');
      
      eventBus.emit('event1');
      eventBus.emit('event2');
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
    
    test('should clear once callbacks when no event specified', () => {
      const callback = jest.fn();
      eventBus.once('test-event', callback);
      
      eventBus.clear();
      
      // Access internal property for testing
      expect(eventBus.onceCallbacks.size).toBe(0);
    });
  });
}); 