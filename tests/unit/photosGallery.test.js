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

  test('photos.html still ships an in-grid loading indicator', () => {
    const html = read('photos.html');
    expect(html).toMatch(/class="gallery-loading"/);
    expect(html).toMatch(/Loading photos/);
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

    expect(grid(win).querySelector('.gallery-loading')).toBeNull();
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

    expect(grid(win).querySelector('.gallery-loading')).toBeNull();
    expect(grid(win).querySelectorAll('.photo-item')).toHaveLength(1);
  });
});
