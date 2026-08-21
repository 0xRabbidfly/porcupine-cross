/**
 * Register Phase Unit Tests
 */

import RegisterPhase from '../../js/components/registerPhase.js';
import eventBus from '../../js/core/eventBus.js';

const FLIP_AT = '2026-10-18T16:00:00-04:00';
const BEFORE = new Date('2026-10-18T09:00:00-04:00').getTime();
const AFTER = new Date('2026-10-18T17:00:00-04:00').getTime();

describe('RegisterPhase', () => {
  let container;

  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = `
      <div class="register-phase" data-flip-at="${FLIP_AT}">
        <div data-phase="pre">Register</div>
        <div data-phase="post" hidden>Results</div>
      </div>
    `;
    container = document.querySelector('.register-phase');
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  test('shows the registration panel before the flip time', () => {
    const phase = new RegisterPhase(container, { getNow: () => BEFORE }).start();

    expect(container.querySelector('[data-phase="pre"]').hidden).toBe(false);
    expect(container.querySelector('[data-phase="post"]').hidden).toBe(true);

    phase.destroy();
  });

  test('shows the results panel after the flip time', () => {
    const phase = new RegisterPhase(container, { getNow: () => AFTER }).start();

    expect(container.querySelector('[data-phase="pre"]').hidden).toBe(true);
    expect(container.querySelector('[data-phase="post"]').hidden).toBe(false);

    phase.destroy();
  });

  test('flips to results once the race end time passes', () => {
    let now = BEFORE;
    const phase = new RegisterPhase(container, { getNow: () => now }).start();

    expect(container.querySelector('[data-phase="post"]').hidden).toBe(true);

    now = AFTER;
    jest.advanceTimersByTime(60000);

    expect(container.querySelector('[data-phase="post"]').hidden).toBe(false);

    phase.destroy();
  });

  test('emits register:phaseChanged only when the phase changes', () => {
    const handler = jest.fn();
    eventBus.on('register:phaseChanged', handler);

    const phase = new RegisterPhase(container, { getNow: () => BEFORE }).start();
    jest.advanceTimersByTime(180000);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ phase: 'pre' });

    eventBus.off('register:phaseChanged', handler);
    phase.destroy();
  });

  test('does not start when a phase panel is missing', () => {
    container.innerHTML = '<div data-phase="pre">Register</div>';
    const phase = new RegisterPhase(container).start();

    expect(phase.intervalId).toBeNull();
  });

  test('create returns null when the container is absent', () => {
    document.body.innerHTML = '';
    expect(RegisterPhase.create()).toBeNull();
  });

  test('destroy clears the interval', () => {
    const phase = new RegisterPhase(container, { getNow: () => BEFORE }).start();
    phase.destroy();

    expect(phase.intervalId).toBeNull();
  });
});
