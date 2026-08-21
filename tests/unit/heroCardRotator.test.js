/**
 * Hero Card Rotator Unit Tests
 */

import HeroCardRotator from '../../js/components/heroCardRotator.js';
import eventBus from '../../js/core/eventBus.js';

describe('HeroCardRotator', () => {
  let container;

  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = `
      <div class="hero-card-rotator" data-rotate-interval="5000">
        <img class="hero-card-slide is-active" src="images/prologue-card-red.png" alt="Card">
        <img class="hero-card-slide" src="images/hero-race-action.jpg" alt="Race action">
      </div>
    `;
    container = document.querySelector('.hero-card-rotator');
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  test('reads the rotation interval from the data attribute', () => {
    expect(new HeroCardRotator(container).intervalMs).toBe(5000);
  });

  test('falls back to the default interval when none is provided', () => {
    container.removeAttribute('data-rotate-interval');
    expect(new HeroCardRotator(container).intervalMs).toBe(7000);
  });

  test('marks only the active slide and hides the rest', () => {
    const rotator = new HeroCardRotator(container).start();
    const slides = container.querySelectorAll('.hero-card-slide');

    expect(slides[0].classList.contains('is-active')).toBe(true);
    expect(slides[1].getAttribute('aria-hidden')).toBe('true');

    rotator.destroy();
  });

  test('advances to the next slide on each interval and wraps around', () => {
    const rotator = new HeroCardRotator(container).start();
    const slides = container.querySelectorAll('.hero-card-slide');

    jest.advanceTimersByTime(5000);
    expect(slides[1].classList.contains('is-active')).toBe(true);
    expect(slides[0].classList.contains('is-active')).toBe(false);

    jest.advanceTimersByTime(5000);
    expect(slides[0].classList.contains('is-active')).toBe(true);

    rotator.destroy();
  });

  test('emits heroCard:changed when the slide changes', () => {
    const handler = jest.fn();
    eventBus.on('heroCard:changed', handler);

    const rotator = new HeroCardRotator(container).start();
    jest.advanceTimersByTime(5000);

    expect(handler).toHaveBeenCalledWith({ index: 1 });

    eventBus.off('heroCard:changed', handler);
    rotator.destroy();
  });

  test('does not start a timer when there is a single slide', () => {
    container.innerHTML = '<img class="hero-card-slide is-active" src="a.png" alt="Only">';
    const rotator = new HeroCardRotator(container).start();

    expect(rotator.intervalId).toBeNull();
  });

  test('destroy clears the interval', () => {
    const rotator = new HeroCardRotator(container).start();
    rotator.destroy();

    expect(rotator.intervalId).toBeNull();
  });

  test('createAll starts a rotator for every container', () => {
    document.body.innerHTML += `
      <div class="hero-card-rotator">
        <img class="hero-card-slide is-active" src="a.png" alt="A">
        <img class="hero-card-slide" src="b.png" alt="B">
      </div>
    `;

    const rotators = HeroCardRotator.createAll();
    expect(rotators).toHaveLength(2);

    rotators.forEach(rotator => rotator.destroy());
  });
});
