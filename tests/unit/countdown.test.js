/**
 * Unit tests for countdown timer functionality
 */

import { calculateTimeRemaining, CountdownTimer } from '../../js/components/countdownTimer';

// Mock DOM elements for testing
function setupDOM() {
  document.body.innerHTML = `
    <div class="countdown-container">
      <div class="countdown-timer">
        <div class="countdown-item">
          <span id="countdown-days">00</span>
          <span class="countdown-label">Days</span>
        </div>
        <div class="countdown-item">
          <span id="countdown-hours">00</span>
          <span class="countdown-label">Hours</span>
        </div>
        <div class="countdown-item">
          <span id="countdown-minutes">00</span>
          <span class="countdown-label">Minutes</span>
        </div>
        <div class="countdown-item">
          <span id="countdown-seconds">00</span>
          <span class="countdown-label">Seconds</span>
        </div>
      </div>
    </div>
  `;

  return {
    days: document.getElementById('countdown-days'),
    hours: document.getElementById('countdown-hours'),
    minutes: document.getElementById('countdown-minutes'),
    seconds: document.getElementById('countdown-seconds'),
    secondsParent: document.getElementById('countdown-seconds').parentElement
  };
}

describe('Countdown Timer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
  });
  
  test('calculateTimeRemaining returns correct time values', () => {
    // Set specific dates for testing
    const targetDate = new Date('2025-09-21T08:00:00Z').getTime();
    const currentDate = new Date('2025-09-20T08:00:00Z').getTime(); // 24 hours before
    
    const result = calculateTimeRemaining(targetDate, currentDate);
    
    expect(result.days).toBe(1);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
  });
  
  test('calculateTimeRemaining handles partial time units correctly', () => {
    const targetDate = new Date('2025-09-21T08:00:00Z').getTime();
    const currentDate = new Date('2025-09-20T07:30:45Z').getTime();
    
    const result = calculateTimeRemaining(targetDate, currentDate);
    
    expect(result.days).toBe(1);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(29);
    expect(result.seconds).toBe(15);
  });
  
  test('calculateTimeRemaining returns negative values when target date is past', () => {
    const targetDate = new Date('2025-09-21T08:00:00Z').getTime();
    const currentDate = new Date('2025-09-22T08:00:00Z').getTime(); // 24 hours after
    
    const result = calculateTimeRemaining(targetDate, currentDate);
    
    expect(result.days).toBe(-1);
    expect(result.distance).toBeLessThan(0);
  });

  test('CountdownTimer updates DOM elements correctly', () => {
    // Setup DOM with test elements
    const elements = setupDOM();
    
    // Mock time calculation function
    const mockCalculateTimeRemaining = jest.fn().mockReturnValue({
      days: 5,
      hours: 4,
      minutes: 3,
      seconds: 2,
      distance: 1000000
    });
    
    // Create timer with mocked time function
    const timer = new CountdownTimer('2025-09-21T00:00:00Z', elements, {
      calculateTimeRemaining: mockCalculateTimeRemaining
    });
    
    timer.update();
    
    // Verify DOM elements are updated with our mocked values
    expect(elements.days.textContent).toBe('05');
    expect(elements.hours.textContent).toBe('04');
    expect(elements.minutes.textContent).toBe('03');
    expect(elements.seconds.textContent).toBe('02');
    
    // Verify mock was called with correct parameters
    expect(mockCalculateTimeRemaining).toHaveBeenCalledTimes(1);
  });

  test('CountdownTimer handles animation classes correctly', () => {
    const elements = setupDOM();
    
    // Mock time calculation to always return the same values except seconds
    let mockSeconds = 15;
    const mockCalculateTimeRemaining = jest.fn().mockImplementation(() => ({
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: mockSeconds,
      distance: 1000000
    }));
    
    // Create timer with our mocked function
    const timer = new CountdownTimer('2025-09-21T00:00:00Z', elements, {
      calculateTimeRemaining: mockCalculateTimeRemaining
    });
    
    // First update with seconds = 15
    timer.update();
    expect(timer.lastSeconds).toBe(15);
    
    // Change mocked seconds to trigger animation
    mockSeconds = 16;
    timer.update();
    
    // Verify animations were added
    expect(elements.secondsParent.classList.contains('pulse')).toBe(true);
    expect(elements.secondsParent.classList.contains('tick')).toBe(true);
    
    // Fast forward 500ms to verify pulse class is removed
    jest.advanceTimersByTime(500);
    expect(elements.secondsParent.classList.contains('pulse')).toBe(false);
    expect(elements.secondsParent.classList.contains('tick')).toBe(true);
    
    // Fast forward to 1000ms to verify tick class is removed
    jest.advanceTimersByTime(500);
    expect(elements.secondsParent.classList.contains('pulse')).toBe(false);
    expect(elements.secondsParent.classList.contains('tick')).toBe(false);
  });
  
  test('CountdownTimer start method sets interval and calls update', () => {
    const elements = setupDOM();
    
    // Spy on setInterval
    jest.spyOn(global, 'setInterval');
    
    // Spy on the update method
    const timer = new CountdownTimer('2025-09-21T00:00:00Z', elements);
    const updateSpy = jest.spyOn(timer, 'update');
    
    // Start the timer
    timer.start();
    
    // Verify update was called and setInterval was set
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(setInterval).toHaveBeenCalledTimes(1);
    expect(timer.intervalId).not.toBeNull();
    
    // Advance time to trigger the interval callback
    jest.advanceTimersByTime(1000);
    expect(updateSpy).toHaveBeenCalledTimes(2);
    
    // Clean up
    timer.stop();
  });
  
  test('CountdownTimer stop method clears interval', () => {
    const elements = setupDOM();
    
    // Spy on clearInterval
    jest.spyOn(global, 'clearInterval');
    
    // Create and start the timer
    const timer = new CountdownTimer('2025-09-21T00:00:00Z', elements);
    timer.start();
    
    // Store the interval ID
    const intervalId = timer.intervalId;
    
    // Stop the timer
    timer.stop();
    
    // Verify clearInterval was called and intervalId was cleared
    expect(clearInterval).toHaveBeenCalledWith(intervalId);
    expect(timer.intervalId).toBeNull();
  });
  
  test('CountdownTimer handles countdown completion', () => {
    const elements = setupDOM();
    const onCompleteMock = jest.fn();
    
    // Create a timer with a date in the past and completion handler
    const mockPastTimeCalculation = jest.fn().mockReturnValue({
      days: -1,
      hours: 0,
      minutes: 0,
      seconds: 0,
      distance: -1000 // Negative distance indicates past date
    });
    
    const timer = new CountdownTimer('2020-01-01T00:00:00Z', elements, {
      calculateTimeRemaining: mockPastTimeCalculation,
      onComplete: onCompleteMock
    });
    
    // Spy on stop method
    const stopSpy = jest.spyOn(timer, 'stop');
    
    // Start and trigger one update
    timer.update();
    
    // Verify stop was called and onComplete handler was triggered
    expect(stopSpy).toHaveBeenCalled();
    expect(onCompleteMock).toHaveBeenCalled();
  });
}); 