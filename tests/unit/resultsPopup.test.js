/**
 * Results Popup Unit Tests
 */

import ResultsPopup from '../../js/components/resultsPopup.js';

const SHOW_AFTER = '2026-10-18T16:00:00-04:00';
const BEFORE = new Date('2026-10-18T09:00:00-04:00').getTime();
const AFTER = new Date('2026-10-24T09:00:00-04:00').getTime();

describe('ResultsPopup', () => {
  let popup;

  beforeEach(() => {
    jest.useFakeTimers();
    window.localStorage.clear();
    window.history.replaceState(null, '', '/');
    document.body.innerHTML = `
      <div class="results-popup" data-show-after="${SHOW_AFTER}" hidden>
        <button type="button" data-popup-close>x</button>
        <a class="results-popup-primary" href="photos.html?replay=Cat%20A">Watch</a>
        <button type="button" class="results-popup-later" data-popup-close>Maybe later</button>
      </div>`;
  });

  afterEach(() => {
    if (popup) popup.destroy();
    popup = null;
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  const element = () => document.querySelector('.results-popup');
  const arm = now => {
    popup = new ResultsPopup(element(), { getNow: () => now }).start();
    jest.advanceTimersByTime(1500);
  };

  test('is dealt a moment after landing, after race day, with the replays in focus', () => {
    arm(AFTER);
    expect(element().hidden).toBe(false);
    expect(document.activeElement).toBe(document.querySelector('.results-popup-primary'));
  });

  test('stays away before race day', () => {
    arm(BEFORE);
    expect(element().hidden).toBe(true);
  });

  test('shows once per browser for an event', () => {
    arm(AFTER);
    popup.close();
    popup = null;
    arm(AFTER);
    expect(element().hidden).toBe(true);
  });

  test('a new event date shows it again', () => {
    window.localStorage.setItem('pc-results-popup-seen', '2025-10-19T16:00:00-04:00');
    arm(AFTER);
    expect(element().hidden).toBe(false);
  });

  test('shows to someone who arrived on a link into the page too', () => {
    window.history.replaceState(null, '', '/?utm_source=instagram#results');
    arm(AFTER);
    expect(element().hidden).toBe(false);
  });

  test('closes on Escape, its x, "Maybe later", the backdrop, or a link', () => {
    const closers = [
      () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })),
      () => document.querySelector('[data-popup-close]').click(),
      () => document.querySelector('.results-popup-later').click(),
      () => element().dispatchEvent(new MouseEvent('click', { bubbles: true })),
      () => {
        const link = document.querySelector('.results-popup-primary');
        link.addEventListener('click', event => event.preventDefault());
        link.click();
      },
    ];
    closers.forEach(close => {
      window.localStorage.clear();
      arm(AFTER);
      expect(element().hidden).toBe(false);
      close();
      expect(element().hidden).toBe(true);
      popup.destroy();
      popup = null;
    });
  });

  test('Tab stays on the card while it is up, and Escape hands focus back', () => {
    const before = document.createElement('button');
    document.body.appendChild(before);
    before.focus();
    arm(AFTER);
    const controls = Array.from(element().querySelectorAll('a[href], button'));
    const tab = shiftKey =>
      document.activeElement.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true })
      );

    controls[controls.length - 1].focus();
    tab(false);
    expect(document.activeElement).toBe(controls[0]);
    tab(true);
    expect(document.activeElement).toBe(controls[controls.length - 1]);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(element().hidden).toBe(true);
    expect(document.activeElement).toBe(before);
  });

  test('create does nothing on a page without one', () => {
    document.body.innerHTML = '';
    expect(ResultsPopup.create()).toBeNull();
  });
});
