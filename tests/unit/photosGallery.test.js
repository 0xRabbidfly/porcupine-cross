/**
 * @jest-environment node
 *
 * Runs in node, not jsdom: this suite builds its own JSDOM instances, and the
 * jsdom test environment does not expose the TextEncoder that jsdom needs.
 */

/**
 * Guards the photos gallery against reusing global class names.
 *
 * `.loading-spinner` belongs to index.html's full-page loader and is styled in
 * style.css as a fixed, viewport-sized, z-index 20000 overlay. When photos.html
 * reused the name for its small in-grid indicator it inherited that box, so the
 * gallery's "Loading photos..." state covered and blocked the whole page.
 */

// Paths are relative to the project root, which is Jest's working directory.
const read = file => fs.readFileSync(file, 'utf8');

import fs from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';

describe('photos gallery loading indicator', () => {
  test('style.css keeps .loading-spinner as the full-page overlay', () => {
    const css = read('style.css');
    const rule = css.slice(css.indexOf('.loading-spinner {'));
    expect(rule).toMatch(/position:\s*fixed/);
    expect(rule).toMatch(/z-index:\s*20000/);
  });

  test('photos.html does not reuse the full-page overlay class', () => {
    expect(read('photos.html')).not.toMatch(/loading-spinner/);
  });

  test('the gallery holds its shape with face-down cards, not a loading message', () => {
    const html = read('photos.html');
    // Painted with the first frame, so the grid is never an empty box.
    expect((html.match(/class="photo-skeleton"/g) || []).length).toBeGreaterThanOrEqual(6);
    expect(html).not.toMatch(/Loading photos/);
  });

  test('index.html still owns the full-page loader', () => {
    expect(read('index.html')).toMatch(/id="main-loading-spinner" class="loading-spinner"/);
  });
});

describe('photos gallery load states', () => {
  const html = read('photos.html');
  const sample = { photos: [{ id: 'photo_001', filename: 'a.JPG' }] };

  // Drives the real inline gallery script against a stubbed fetch.
  function boot(respond) {
    const virtualConsole = new VirtualConsole();
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: 'https://example.test/photos.html',
      virtualConsole,
      beforeParse(win) {
        win.fetch = (url, opts = {}) => respond(url, opts);
        win.IntersectionObserver = class {
          observe() {}
          disconnect() {}
          unobserve() {}
        };
        // Collapse the gallery's 15s deadline so the suite stays fast.
        const realSetTimeout = win.setTimeout;
        win.setTimeout = (fn, ms, ...rest) => realSetTimeout(fn, ms === 15000 ? 20 : ms, ...rest);
      },
    });
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    return dom.window;
  }

  const settle = () => new Promise(resolve => setTimeout(resolve, 250));
  const grid = win => win.document.getElementById('photo-grid');

  test('a stalled request gives up instead of spinning forever', async () => {
    const win = boot(
      (url, opts) =>
        new Promise((_, reject) => {
          opts.signal.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
          );
        })
    );
    await settle();

    expect(grid(win).querySelector('.photo-skeleton')).toBeNull();
    expect(grid(win).querySelector('.gallery-retry')).not.toBeNull();
    expect(grid(win).textContent).toContain("Photos didn't load");
  });

  test('a network failure offers a retry rather than claiming no photos exist', async () => {
    const win = boot(() => Promise.reject(new TypeError('Failed to fetch')));
    await settle();

    expect(grid(win).textContent).toContain("Photos didn't load");
    expect(grid(win).textContent).not.toContain('Coming Soon');
  });

  test('a missing gallery still reads as coming soon', async () => {
    const win = boot(() =>
      Promise.resolve({ ok: false, status: 404, statusText: 'Not Found', json: async () => ({}) })
    );
    await settle();

    expect(grid(win).textContent).toContain('Photos Coming Soon');
    expect(grid(win).querySelector('.gallery-retry')).toBeNull();
  });

  test('a good response clears the indicator and renders the photos', async () => {
    const win = boot(() => Promise.resolve({ ok: true, status: 200, json: async () => sample }));
    await settle();

    expect(grid(win).querySelector('.photo-skeleton')).toBeNull();
    expect(grid(win).querySelectorAll('.photo-item')).toHaveLength(1);
  });
  test('a slow year switch shows face-down cards rather than an empty grid', async () => {
    let release;
    const win = boot(
      () =>
        new Promise(resolve => {
          release = () => resolve({ ok: true, status: 200, json: async () => sample });
        })
    );
    await settle();
    // 2026 is the default, so switch to the other year.
    win.document.querySelector('.gallery-year-btn[data-year="2025"]').click();

    expect(grid(win).querySelectorAll('.photo-skeleton').length).toBeGreaterThan(0);
    release();
  });
});

describe('photos gallery race filter', () => {
  const html = read('photos.html');

  // Race-day times in Ontario (EDT, UTC-4), as photos.json stores them in UTC.
  const at = hhmm => {
    const [h, m] = hhmm.split(':').map(Number);
    return new Date(Date.UTC(2026, 9, 18, h + 4, m)).toISOString();
  };
  const shots = [
    ['warmup', '08:20'],
    ['menC', '09:05'],
    ['menC-late', '09:59'],
    ['youth', '10:00'],
    ['menB', '11:30'],
    ['menB-gap', '12:10'], // no 12:00 chip: the women's pre-ride is not a race
    ['kids', '12:45'],
    ['women', '13:40'],
    ['menA', '14:25'],
    ['menA-late', '15:30'],
  ];
  const sample = {
    photos: shots.map(([name, time], i) => ({
      id: `photo_${i + 1}`,
      filename: `${name}.jpg`,
      date_taken: at(time),
    })),
  };

  function boot() {
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: 'https://example.test/photos.html',
      virtualConsole: new VirtualConsole(),
      beforeParse(win) {
        win.fetch = () => Promise.resolve({ ok: true, status: 200, json: async () => sample });
        win.IntersectionObserver = class {
          observe() {}
          disconnect() {}
          unobserve() {}
        };
      },
    });
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    return dom.window;
  }

  const settle = () => new Promise(resolve => setTimeout(resolve, 50));
  const shown = win =>
    Array.from(win.document.querySelectorAll('#photo-grid .photo-item img')).map(img =>
      img.src.split('/').pop().replace('.jpg', '')
    );
  const chip = (win, time) =>
    win.document.querySelector(`.gallery-race-btn[data-start="2026-10-18T${time}:00-04:00"]`);

  test('every race chip starts when the schedule on index.html says it does', () => {
    const index = new JSDOM(read('index.html')).window.document;
    const to24h = text => {
      const [, h, m, half] = text.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
      const hour = (Number(h) % 12) + (half.toLowerCase() === 'pm' ? 12 : 0);
      return `${String(hour).padStart(2, '0')}:${m}`;
    };
    const scheduled = Array.from(index.querySelectorAll('.schedule-grid > .schedule-item'))
      .filter(item => !/pre-ride/i.test(item.querySelector('.event-description').textContent))
      .map(item => to24h(item.querySelector('.event-time').textContent));

    const page = new JSDOM(html).window.document;
    const chips = Array.from(page.querySelectorAll('.gallery-races[data-year="2026"] [data-start]'))
      .map(button => button.dataset.start)
      .filter(Boolean)
      .map(start => start.slice(11, 16));

    expect(scheduled.length).toBeGreaterThan(0);
    expect(chips).toEqual(scheduled);
  });

  test('all races is selected to start with and shows the whole year', async () => {
    const win = boot();
    await settle();

    expect(
      win.document.querySelector('.gallery-race-btn[data-start=""]').getAttribute('aria-pressed')
    ).toBe('true');
    expect(shown(win)).toHaveLength(shots.length);
  });

  test('a race shows the photos from its start to the next start', async () => {
    const win = boot();
    await settle();

    chip(win, '10:00').click();
    expect(shown(win)).toEqual(['youth']);
    expect(chip(win, '10:00').getAttribute('aria-pressed')).toBe('true');
    expect(win.document.getElementById('photo-count').textContent).toBe('1 Photos Available');

    chip(win, '11:00').click();
    expect(shown(win)).toEqual(['menB', 'menB-gap']);
  });

  test('the first window takes earlier photos and the last runs to the end of the day', async () => {
    const win = boot();
    await settle();

    chip(win, '09:00').click();
    expect(shown(win)).toEqual(['warmup', 'menC', 'menC-late']);

    chip(win, '14:20').click();
    expect(shown(win)).toEqual(['menA', 'menA-late']);
  });

  test('each chip counts its photos', async () => {
    const win = boot();
    await settle();

    const count = time => chip(win, time).querySelector('.race-count').textContent;
    expect(count('10:00')).toBe('1');
    expect(count('13:15')).toBe('1');
    expect(
      win.document.querySelector('.gallery-race-btn[data-start=""] .race-count').textContent
    ).toBe(String(shots.length));
  });

  test('a race nobody photographed hides its chip', async () => {
    const kidsFree = { photos: sample.photos.filter(photo => photo.filename !== 'kids.jpg') };
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: 'https://example.test/photos.html',
      virtualConsole: new VirtualConsole(),
      beforeParse(w) {
        w.fetch = () => Promise.resolve({ ok: true, status: 200, json: async () => kidsFree });
        w.IntersectionObserver = class {
          observe() {}
          disconnect() {}
          unobserve() {}
        };
      },
    });
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    await settle();

    expect(chip(dom.window, '12:30').hidden).toBe(true);
    expect(chip(dom.window, '11:00').hidden).toBe(false);
  });

  test('the lightbox steps through the selected race only', async () => {
    const win = boot();
    await settle();

    chip(win, '14:20').click();
    win.document.querySelector('#photo-grid .photo-item').click();
    win.document.getElementById('lightbox-next').click();
    expect(win.document.getElementById('lightbox-image').src).toMatch(/menA-late\.jpg$/);
    win.document.getElementById('lightbox-next').click();
    expect(win.document.getElementById('lightbox-image').src).toMatch(/menA-late\.jpg$/);
  });

  test('a year without a race schedule hides the chips and shows everything', async () => {
    const win = boot();
    await settle();

    chip(win, '09:00').click();
    win.document.querySelector('.gallery-year-btn[data-year="2025"]').click();
    await settle();

    expect(win.document.querySelector('.gallery-races[data-year="2026"]').hidden).toBe(true);
    expect(shown(win)).toHaveLength(shots.length);
  });
});
