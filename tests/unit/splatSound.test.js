/**
 * Splat Sound Tests
 * Tests the audio feedback system for menu interactions
 */
let playSplatSound;
let menuLink;

beforeEach(() => {
  jest.useFakeTimers();
  playSplatSound = jest.fn();
  menuLink = document.createElement('a');
  menuLink.className = 'menu-link';
  document.body.appendChild(menuLink);
  // Simulate the event handler setup
  let lastClick = 0;
  // Simulate priming audio before any click
  window.audioPrimed = true;
  menuLink.addEventListener('click', () => {
    const now = Date.now();
    if (now - lastClick < 1000) return;
    lastClick = now;
    if (Math.random() < 0.3) playSplatSound();
  });
});

afterEach(() => {
  document.body.innerHTML = '';
  jest.useRealTimers();
});

test('does not fire on page load', () => {
  expect(playSplatSound).not.toHaveBeenCalled();
});

test('fires only on menu link click and only 30% of the time', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.2); // Should fire
  menuLink.click();
  expect(playSplatSound).toHaveBeenCalledTimes(1);
  Math.random.mockReturnValue(0.5); // Should not fire
  menuLink.click();
  expect(playSplatSound).toHaveBeenCalledTimes(1);
  Math.random.mockRestore();
});

test('does not fire within 1 second of last click', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.2); // Should fire
  menuLink.click();
  expect(playSplatSound).toHaveBeenCalledTimes(1);
  // Try again within 1 second
  jest.advanceTimersByTime(500);
  menuLink.click();
  expect(playSplatSound).toHaveBeenCalledTimes(1);
  // After 1 second
  jest.advanceTimersByTime(501);
  menuLink.click();
  expect(playSplatSound).toHaveBeenCalledTimes(2);
  Math.random.mockRestore();
});

test('desktop nav link click plays sound (probability passes)', () => {
  // Simulate desktop
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
  jest.spyOn(Math, 'random').mockReturnValue(0.2); // Should fire
  menuLink.click();
  expect(playSplatSound).toHaveBeenCalledTimes(1);
  Math.random.mockRestore();
});
