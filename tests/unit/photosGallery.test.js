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
    photographers: [
      { name: 'Jamie Gonzalez', photos: 5 },
      { name: 'Marija Gonzalez Najera', photos: 5 },
    ],
    photos: shots.map(([name, time], i) => ({
      id: `photo_${i + 1}`,
      filename: `${name}.jpg`,
      date_taken: at(time),
      photographer: i % 2 ? 'Marija Gonzalez Najera' : 'Jamie Gonzalez',
    })),
  };

  function boot(data = sample) {
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: 'https://example.test/photos.html',
      virtualConsole: new VirtualConsole(),
      beforeParse(win) {
        win.fetch = () => Promise.resolve({ ok: true, status: 200, json: async () => data });
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
    expect(win.document.getElementById('photo-count').textContent).toBe(
      '1 photo from U17, U15 and U13'
    );

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

  test('a sideways swipe moves the lightbox to the next photo and back', async () => {
    const win = boot();
    await settle();

    chip(win, '14:20').click();
    win.document.querySelector('#photo-grid .photo-item').click();
    const lightbox = win.document.getElementById('lightbox');
    const image = win.document.getElementById('lightbox-image');
    const first = image.src;
    const swipe = (from, to) => {
      const start = new win.Event('touchstart');
      start.touches = [{ clientX: from }];
      lightbox.dispatchEvent(start);
      const end = new win.Event('touchend');
      end.changedTouches = [{ clientX: to }];
      lightbox.dispatchEvent(end);
    };

    swipe(300, 290);
    expect(image.src).toBe(first);
    swipe(300, 100);
    expect(image.src).toMatch(/menA-late\.jpg$/);
    swipe(100, 300);
    expect(image.src).toBe(first);
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

  test('a scroll sentinel already in view does not skip the first photos', async () => {
    let release;
    let seeSentinel;
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: 'https://example.test/photos.html',
      virtualConsole: new VirtualConsole(),
      beforeParse(w) {
        w.fetch = () =>
          new Promise(resolve => {
            release = () => resolve({ ok: true, status: 200, json: async () => sample });
          });
        w.IntersectionObserver = class {
          constructor(callback) {
            seeSentinel = () => callback([{ isIntersecting: true }]);
          }
          observe() {}
          disconnect() {}
          unobserve() {}
        };
      },
    });
    const win = dom.window;
    win.document.dispatchEvent(new win.Event('DOMContentLoaded'));

    // A tall screen: the sentinel is visible while photos.json is in flight,
    // and the photos land before the paging delay runs out.
    seeSentinel();
    release();
    await new Promise(resolve => setTimeout(resolve, 400));

    expect(win.document.querySelectorAll('#photo-grid .photo-skeleton')).toHaveLength(0);
    expect(shown(win)).toEqual(shots.map(([name]) => name));
  });

  test('photos run in the order they were taken, whatever order the file lists them', async () => {
    const win = boot({ ...sample, photos: [...sample.photos].reverse() });
    await settle();

    expect(shown(win)).toEqual(shots.map(([name]) => name));
  });

  describe('credits', () => {
    test('the header credits the year’s photographers', async () => {
      const win = boot();
      await settle();

      const credit = win.document.getElementById('gallery-credit');
      expect(credit.hidden).toBe(false);
      expect(credit.textContent).toBe('Photographed by Jamie Gonzalez and Marija Gonzalez Najera');
    });

    test('a year whose photos.json names nobody shows no credit line', async () => {
      const win = boot({ photos: sample.photos });
      await settle();

      expect(win.document.getElementById('gallery-credit').hidden).toBe(true);
    });

    test('the lightbox says which race, when, and who took it', async () => {
      const win = boot();
      await settle();

      chip(win, '11:00').click();
      win.document.querySelector('#photo-grid .photo-item').click();
      const text = id => win.document.getElementById(id).textContent;

      expect(text('lightbox-title')).toBe('Men B and Masters 35+');
      expect(text('lightbox-when')).toBe('11:30 am, 30 minutes in');
      expect(text('lightbox-credit')).toBe('Photo by Jamie Gonzalez');
    });

    test('a download carries the photographer’s name', async () => {
      const win = boot();
      await settle();

      win.document.querySelector('#photo-grid .photo-item').click();
      expect(win.document.getElementById('lightbox-download').download).toBe(
        'Prologue2026_JamieGonzalez_warmup.jpg'
      );
    });
  });

  describe('race-day timeline', () => {
    const track = win => win.document.querySelector('.day-timeline-track');
    const ticks = win => Array.from(win.document.querySelectorAll('.day-timeline-ticks line'));
    const key = (win, name) =>
      track(win).dispatchEvent(new win.KeyboardEvent('keydown', { key: name, bubbles: true }));

    test('draws one mark per photo, each race’s marks under its own tab', async () => {
      const win = boot();
      await settle();

      expect(win.document.querySelector('.race-deck').hidden).toBe(false);
      expect(ticks(win)).toHaveLength(shots.length);

      // Six races with photos share the strip in equal columns, in start order.
      const column = name => {
        const i = shots.findIndex(([shot]) => shot === name);
        return Math.floor(Number(ticks(win)[i].getAttribute('x1')) / (1000 / 6));
      };
      expect(column('warmup')).toBe(0);
      expect(column('menC-late')).toBe(0);
      expect(column('youth')).toBe(1);
      expect(column('menB-gap')).toBe(2);
      expect(column('kids')).toBe(3);
      expect(column('women')).toBe(4);
      expect(column('menA-late')).toBe(5);
    });

    test('the page says what the grid is showing, not how to use the site', async () => {
      const win = boot();
      await settle();

      expect(win.document.getElementById('gallery-description')).toBeNull();
      expect(win.document.getElementById('photo-count').textContent).toBe('10 photos');
      chip(win, '14:20').click();
      expect(win.document.getElementById('photo-count').textContent).toBe(
        '2 photos from Men A and Single Speed'
      );
    });

    test('marks sit in time order from left to right', async () => {
      const win = boot();
      await settle();

      const xs = ticks(win).map(line => Number(line.getAttribute('x1')));
      expect([...xs].sort((a, b) => a - b)).toEqual(xs);
      expect(xs[0]).toBeGreaterThan(0);
      expect(xs[xs.length - 1]).toBeLessThan(1000);
    });

    test('choosing a race dims the rest of the day', async () => {
      const win = boot();
      await settle();

      chip(win, '14:20').click();
      const dim = ticks(win).map(line => line.classList.contains('is-dim'));
      expect(dim.filter(d => !d)).toHaveLength(2);
      expect(win.document.querySelector('.race-deck').classList.contains('is-filtered')).toBe(true);
    });

    test('arrow keys step photo by photo and say where they are', async () => {
      const win = boot();
      await settle();

      track(win).focus();
      key(win, 'ArrowRight');
      key(win, 'ArrowRight');

      expect(track(win).getAttribute('aria-valuenow')).toBe('2');
      expect(track(win).getAttribute('aria-valuetext')).toBe(
        '9:59 am, 59 minutes in, Men C and Masters 55+, photo 3 of 10'
      );
      expect(win.document.querySelector('.day-timeline-peek').hidden).toBe(false);
    });

    test('Enter opens the photo and moves to its race if another is selected', async () => {
      const win = boot();
      await settle();

      chip(win, '14:20').click();
      track(win).focus();
      key(win, 'Home');
      key(win, 'Enter');

      expect(win.document.getElementById('lightbox').style.display).toBe('flex');
      expect(win.document.getElementById('lightbox-image').src).toMatch(/warmup\.jpg$/);
      expect(chip(win, '09:00').getAttribute('aria-pressed')).toBe('true');
    });

    test('a year without a race schedule has no timeline', async () => {
      const win = boot();
      await settle();

      win.document.querySelector('.gallery-year-btn[data-year="2025"]').click();
      await settle();

      expect(win.document.querySelector('.race-deck').hidden).toBe(true);
    });
  });
});

describe('photos gallery bib finder', () => {
  const html = read('photos.html');

  const at = hhmm => {
    const [h, m] = hhmm.split(':').map(Number);
    return new Date(Date.UTC(2026, 9, 18, h + 4, m)).toISOString();
  };
  // Bib 204 rides Men B: read in two photos, matched by kit in one.
  const shots = [
    ['menC', '09:05', undefined],
    ['menB-1', '11:10', { 204: 'number' }],
    ['menB-2', '11:20', { 204: 'kit' }],
    ['menB-3', '11:30', { 5: 'number' }],
    ['menB-4', '11:40', { 204: 'number', 5: 'kit' }],
    ['women', '13:40', undefined],
  ];
  const tagged = {
    photos: shots.map(([name, time, bibs], i) => ({
      id: `photo_${i + 1}`,
      filename: `${name}.jpg`,
      date_taken: at(time),
      ...(bibs && { bibs }),
    })),
  };

  function boot(data = tagged, query = '') {
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: `https://example.test/photos.html${query}`,
      virtualConsole: new VirtualConsole(),
      beforeParse(win) {
        win.fetch = () => Promise.resolve({ ok: true, status: 200, json: async () => data });
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

  const settle = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms));
  const shown = win =>
    Array.from(win.document.querySelectorAll('#photo-grid .photo-item img')).map(img =>
      img.src.split('/').pop().replace('.jpg', '')
    );
  const finder = win => win.document.querySelector('.bib-finder');
  const input = win => win.document.getElementById('bib-input');
  const count = win => win.document.getElementById('photo-count').textContent;
  const pressed = win =>
    win.document.querySelector('.gallery-race-btn[aria-pressed="true"]').dataset.start;
  const search = (win, value) => {
    input(win).value = value;
    finder(win).dispatchEvent(new win.Event('submit', { cancelable: true }));
  };

  test('shows only for a year whose photos carry bib tags', async () => {
    const win = boot();
    await settle();
    expect(finder(win).hidden).toBe(false);

    win.document.querySelector('.gallery-year-btn[data-year="2025"]').click();
    await settle();
    expect(finder(win).hidden).toBe(true);

    const untagged = boot({ photos: tagged.photos.map(({ bibs: _bibs, ...photo }) => photo) });
    await settle();
    expect(finder(untagged).hidden).toBe(true);
  });

  test("a bib shows that rider's photos in order and lights their race", async () => {
    const win = boot();
    await settle();
    search(win, '204');

    expect(shown(win)).toEqual(['menB-1', 'menB-2', 'menB-4']);
    expect(pressed(win)).toBe('2026-10-18T11:00:00-04:00');
    expect(count(win)).toBe('3 photos of bib 204, 1 matched by kit');
  });

  test('a photo matched by kit says so, a photo with the number read does not', async () => {
    const win = boot();
    await settle();
    search(win, '204');

    const tags = Array.from(win.document.querySelectorAll('#photo-grid .photo-item')).map(item => {
      const tag = item.querySelector('.photo-tag');
      return tag ? tag.textContent : null;
    });
    expect(tags).toEqual([null, 'Likely you', null]);
  });

  test('typing waits for the whole number and ignores anything but digits', async () => {
    const win = boot();
    await settle();
    input(win).value = '2';
    input(win).dispatchEvent(new win.Event('input'));
    input(win).value = '2o4';
    input(win).dispatchEvent(new win.Event('input'));
    expect(input(win).value).toBe('24');
    input(win).value = '204';
    input(win).dispatchEvent(new win.Event('input'));
    // Nothing has narrowed while the number was still being typed.
    expect(shown(win)).toHaveLength(shots.length);

    await settle(600);
    expect(shown(win)).toEqual(['menB-1', 'menB-2', 'menB-4']);
  });

  test('the address carries the bib, and a link with one opens on that rider', async () => {
    const win = boot();
    await settle();
    search(win, '0204');
    expect(win.location.search).toBe('?bib=204');
    expect(input(win).value).toBe('204');

    win.document.querySelector('.bib-clear').click();
    expect(win.location.search).toBe('');
    // Clearing goes back to the race that was lit for the rider.
    expect(shown(win)).toEqual(['menB-1', 'menB-2', 'menB-3', 'menB-4']);

    const linked = boot(tagged, '?bib=5');
    await settle();
    expect(shown(linked)).toEqual(['menB-3', 'menB-4']);
    expect(input(linked).value).toBe('5');
  });

  test('a bib with no photos says what to try, and offers the whole gallery', async () => {
    const win = boot();
    await settle();
    search(win, '57');

    const grid = win.document.getElementById('photo-grid');
    expect(grid.textContent).toContain('No photos found for bib 57');
    expect(grid.textContent).toContain('The youth and kids races are not tagged.');
    expect(count(win)).toBe('No photos of bib 57');

    grid.querySelector('.gallery-retry').click();
    expect(shown(win)).toHaveLength(shots.length);
    expect(input(win).value).toBe('');
    expect(pressed(win)).toBe('');
  });

  test("choosing a race leaves bib search, even the rider's own race", async () => {
    const win = boot();
    await settle();
    search(win, '204');

    win.document.querySelector('.gallery-race-btn[data-start="2026-10-18T11:00:00-04:00"]').click();
    expect(shown(win)).toEqual(['menB-1', 'menB-2', 'menB-3', 'menB-4']);
    expect(input(win).value).toBe('');
    expect(win.location.search).toBe('');
    expect(count(win)).toBe('4 photos from Men B and Masters 35+');
  });

  test("the timeline lights only the rider's marks, and the lightbox steps through them", async () => {
    const win = boot();
    await settle();
    search(win, '204');

    const lit = Array.from(win.document.querySelectorAll('.day-timeline-ticks line')).map(
      line => !line.classList.contains('is-dim')
    );
    expect(lit).toEqual([false, true, true, false, true, false]);

    win.document.querySelector('#photo-grid .photo-item').click();
    win.document.getElementById('lightbox-next').click();
    win.document.getElementById('lightbox-next').click();
    expect(win.document.getElementById('lightbox-image').src).toMatch(/menB-4\.jpg$/);
  });
});

describe('photos gallery rider panel', () => {
  const html = read('photos.html');
  const at = hhmm => {
    const [h, m] = hhmm.split(':').map(Number);
    return new Date(Date.UTC(2026, 9, 18, h + 4, m)).toISOString();
  };
  // Bib 204 rides Men B (6 laps in 42:00, 7 minutes a lap) and single speed as 289.
  const shots = [
    ['menB-1', '11:10', { 204: 'number' }],
    ['menB-2', '11:20', { 204: 'kit', 5: 'number' }],
    ['menB-3', '11:30', { 5: 'number' }],
    ['menB-4', '11:40', { 204: 'number', 5: 'kit', 7: 'number' }],
    ['menA-1', '14:40', { 289: 'number' }],
  ];
  const data = {
    photos: shots.map(([name, time, bibs], i) => ({
      id: `photo_${i + 1}`,
      filename: `${name}.jpg`,
      date_taken: at(time),
      bibs,
    })),
    results: {
      204: {
        race: 'Master Men 35+',
        place: 2,
        field: 9,
        laps: 6,
        time: '42:00',
        start: '2026-10-18T11:01:00-04:00',
      },
      289: {
        race: 'Single Speed',
        place: 4,
        field: 6,
        laps: 6,
        time: '49:03',
        start: '2026-10-18T14:21:00-04:00',
      },
      5: { race: 'Cat B', status: 'DNF', start: '2026-10-18T11:00:00-04:00', field: 18 },
      7: {
        race: 'Master Men 35+',
        place: 3,
        field: 9,
        laps: 5,
        time: '40:30',
        start: '2026-10-18T11:01:00-04:00',
      },
      8: {
        race: 'Master Men 35+',
        place: 4,
        field: 9,
        laps: 5,
        time: '40:33',
        start: '2026-10-18T11:01:00-04:00',
      },
      9: { race: 'Cat B', status: 'DNS', start: '2026-10-18T11:00:00-04:00', field: 18 },
    },
    same_rider: [['204', '289']],
  };

  function boot() {
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: 'https://example.test/photos.html',
      virtualConsole: new VirtualConsole(),
      beforeParse(win) {
        win.fetch = () => Promise.resolve({ ok: true, status: 200, json: async () => data });
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
  const search = (win, value) => {
    win.document.getElementById('bib-input').value = value;
    win.document
      .querySelector('.bib-finder')
      .dispatchEvent(new win.Event('submit', { cancelable: true }));
  };
  const panel = win => win.document.querySelector('.rider-panel');
  const text = (win, sel) => panel(win).querySelector(sel).textContent.replace(/\s+/g, ' ').trim();

  test('stays hidden until a bib is searched, and hides again when it is cleared', async () => {
    const win = boot();
    await settle();
    expect(panel(win).hidden).toBe(true);
    search(win, '204');
    expect(panel(win).hidden).toBe(false);
    win.document.querySelector('.bib-clear').click();
    expect(panel(win).hidden).toBe(true);
  });

  test('gives the rider their result', async () => {
    const win = boot();
    await settle();
    search(win, '204');
    expect(text(win, '.rider-bib')).toBe('204');
    expect(text(win, '.rider-result')).toBe('2nd of 9 in Master Men 35+');
    expect(text(win, '.rider-detail')).toBe('42:00 over 6 laps');

    search(win, '5');
    expect(text(win, '.rider-result')).toBe('Raced Cat B');
    expect(text(win, '.rider-detail')).toBe('Did not finish');
  });

  test('marks each photo with the lap it caught the rider on', async () => {
    const win = boot();
    await settle();
    search(win, '204');
    const laps = Array.from(win.document.querySelectorAll('#photo-grid .photo-lap')).map(
      mark => mark.textContent
    );
    // 9, 19 and 39 minutes after an 11:01 start, at 7 minutes a lap.
    expect(laps).toEqual(['Lap 2', 'Lap 3', 'Lap 6']);
  });

  test('links the same rider on their other bib', async () => {
    const win = boot();
    await settle();
    search(win, '204');
    const also = Array.from(panel(win).querySelectorAll('.rider-link')).find(link =>
      link.textContent.startsWith('Also raced')
    );
    expect(also.textContent.replace(/\s+/g, ' ')).toBe('Also raced Single Speed as 289');
    also.click();
    expect(win.document.getElementById('bib-input').value).toBe('289');
    expect(text(win, '.rider-result')).toBe('4th of 6 in Single Speed');
  });

  test('lists who shared the frame, most photos first, and jumps to them', async () => {
    const win = boot();
    await settle();
    search(win, '204');
    const rivals = Array.from(panel(win).querySelectorAll('.rider-link'))
      .filter(link => !link.textContent.startsWith('Also'))
      .map(link => link.textContent.replace(/\s+/g, ' ').trim());
    expect(rivals).toEqual(['5 2 photos', '7 1 photo']);

    panel(win).querySelectorAll('.rider-link')[1].click();
    expect(win.location.search).toBe('?bib=5');
  });

  test('offers a photo card of the rider', async () => {
    const win = boot();
    await settle();
    search(win, '204');
    const button = panel(win).querySelector('.rider-card-btn');
    expect(button.hidden).toBe(false);
    expect(button.textContent.trim()).toBe('Make my photo card');
  });

  test('the card takes the close-ups, two minutes apart, in race order', async () => {
    const win = boot();
    await settle();
    const shot = (name, time, size, how = 'number') => ({
      filename: name,
      date_taken: at(time),
      bibs: { 204: how },
      sizes: { 204: size },
    });
    const photos = [
      shot('far', '11:05', 0.05),
      shot('burst-1', '11:10', 0.5),
      shot('burst-2', '11:10', 0.45),
      shot('mid', '11:20', 0.3),
      shot('kit', '11:30', 0.3, 'kit'),
      shot('late', '11:40', 0.25),
    ];
    const pick = win
      .eval('PhotoGallery.prototype.cardPhotos')
      .call({ bib: '204', photos })
      .map(photo => photo.filename);
    // burst-2 is a second frame of the same moment; the kit match counts for less.
    expect(pick).toEqual(['burst-1', 'mid', 'late']);
  });

  test('offers every photo of the rider as one download', async () => {
    const win = boot();
    await settle();
    search(win, '204');
    expect(text(win, '.rider-zip-btn')).toBe('Download all 3 photos');
    search(win, '289');
    expect(text(win, '.rider-zip-btn')).toBe('Download the photo');
  });

  test('builds a zip that stores each file with its checksum', () => {
    const hello = Uint8Array.from('hello', ch => ch.charCodeAt(0));
    const parts = boot().zipParts([
      { name: 'a.txt', data: hello, date: new Date(2026, 9, 18, 11, 0, 0) },
    ]);
    const bytes = Uint8Array.from(parts.flatMap(part => Array.from(part)));
    const view = new DataView(bytes.buffer);
    const u32 = at => view.getUint32(at, true);
    const ascii = (from, to) => String.fromCharCode(...bytes.subarray(from, to));

    expect(u32(0)).toBe(0x04034b50);
    expect(u32(14)).toBe(0x3610a686);
    expect(ascii(30, 35)).toBe('a.txt');
    expect(ascii(35, 40)).toBe('hello');
    const end = bytes.length - 22;
    expect(u32(end)).toBe(0x06054b50);
    expect(view.getUint16(end + 10, true)).toBe(1);
    // The directory starts where the one entry ends.
    expect(u32(end + 16)).toBe(40);
    expect(u32(40)).toBe(0x02014b50);
  });
});

describe('photos gallery results board', () => {
  const html = read('photos.html');
  const data = {
    photos: [
      {
        id: 'photo_1',
        filename: 'menB.jpg',
        date_taken: '2026-10-18T15:20:00Z',
        bibs: { 204: 'kit', 5: 'number' },
        sizes: { 204: 0.4, 5: 0.1 },
      },
      {
        id: 'photo_2',
        filename: 'menB-2.jpg',
        date_taken: '2026-10-18T15:30:00Z',
        bibs: { 204: 'number' },
        sizes: { 204: 0.2 },
      },
    ],
    results: {
      204: {
        race: 'Master Men 35+',
        place: 1,
        field: 3,
        laps: 6,
        time: '42:00',
        start: '2026-10-18T11:01:00-04:00',
      },
      7: {
        race: 'Master Men 35+',
        place: 2,
        field: 3,
        laps: 6,
        time: '43:05',
        start: '2026-10-18T11:01:00-04:00',
      },
      8: {
        race: 'Master Men 35+',
        place: 3,
        field: 3,
        laps: 5,
        time: '43:08',
        start: '2026-10-18T11:01:00-04:00',
      },
      5: { race: 'Cat B', status: 'DNF', start: '2026-10-18T11:00:00-04:00', field: 1 },
      6: {
        race: 'Cat B',
        place: 1,
        field: 1,
        laps: 6,
        time: '41:00',
        start: '2026-10-18T11:00:00-04:00',
      },
      9: { race: 'Cat B', status: 'DNS', start: '2026-10-18T11:00:00-04:00', field: 1 },
      30: {
        race: 'Cat A',
        place: 1,
        field: 1,
        laps: 9,
        time: '58:33',
        start: '2026-10-18T14:20:00-04:00',
      },
      31: {
        race: 'Cat A',
        place: 2,
        field: 2,
        laps: 9,
        time: '58:40',
        start: '2026-10-18T14:20:00-04:00',
      },
    },
  };

  function boot() {
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: 'https://example.test/photos.html',
      virtualConsole: new VirtualConsole(),
      beforeParse(win) {
        win.fetch = () => Promise.resolve({ ok: true, status: 200, json: async () => data });
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
  const board = win => win.document.querySelector('.race-results');
  const squash = node => node.textContent.replace(/\s+/g, ' ').trim();
  const tabs = win => Array.from(board(win).querySelectorAll('.standings-tab')).map(squash);
  const shown = win => squash(board(win).querySelector('.standings-tab[aria-pressed="true"]'));
  const pickTab = (win, race) =>
    board(win).querySelector(`.standings-tab[data-race="${race}"]`).click();
  const rows = win =>
    Array.from(board(win).querySelectorAll('.standings-table tbody tr')).map(squash);
  const pickRace = (win, start) =>
    win.document
      .querySelector(`.gallery-race-btn[data-start="2026-10-18T${start}:00-04:00"]`)
      .click();

  test('tabs every category in start order under All, folded until opened', async () => {
    const win = boot();
    await settle();
    expect(board(win).hidden).toBe(false);
    expect(board(win).open).toBe(false);
    expect(squash(board(win).querySelector('.race-results-title'))).toBe('Results');
    expect(tabs(win)).toEqual(['Cat B 1', 'Master Men 35+ 3', 'Cat A 2']);
    expect(shown(win)).toBe('Cat B 1');
  });

  test('shows one category at a time, with gaps, laps down and no DNS', async () => {
    const win = boot();
    await settle();
    expect(board(win).querySelectorAll('.standings-table')).toHaveLength(1);
    expect(rows(win)).toEqual(['1 6 41:00 None', 'DNF 5 1']);

    pickTab(win, 'Master Men 35+');
    expect(shown(win)).toBe('Master Men 35+ 3');
    expect(rows(win)).toEqual([
      '1 204 42:00 2',
      '2 7 43:05 +1:05 None',
      '3 8 43:08 1 lap down None',
    ]);
  });

  test('a race narrows the tabs and keeps the chosen category when it can', async () => {
    const win = boot();
    await settle();
    pickTab(win, 'Master Men 35+');
    pickRace(win, '11:00');
    expect(squash(board(win).querySelector('.race-results-title'))).toBe(
      'Results: Men B and Masters 35+'
    );
    expect(tabs(win)).toEqual(['Cat B 1', 'Master Men 35+ 3']);
    expect(shown(win)).toBe('Master Men 35+ 3');

    pickRace(win, '14:20');
    expect(tabs(win)).toEqual(['Cat A 2']);
    expect(shown(win)).toBe('Cat A 2');
  });

  test('names the closest finish on the same lap, within ten seconds', async () => {
    const win = boot();
    await settle();
    expect(board(win).querySelector('.standings-closest')).toBeNull();
    pickTab(win, 'Cat A');
    expect(squash(board(win).querySelector('.standings-closest'))).toBe(
      'Closest finish: 30 and 31, 7 seconds apart'
    );
  });

  test("a rider's photos open from the board, which steps aside for the rider", async () => {
    const win = boot();
    await settle();
    pickTab(win, 'Master Men 35+');
    board(win).querySelector('button[data-bib="204"]').click();
    expect(win.location.search).toBe('?bib=204');
    expect(win.document.querySelector('.rider-panel').hidden).toBe(false);
    expect(board(win).hidden).toBe(true);

    win.document.querySelector('.bib-clear').click();
    expect(board(win).hidden).toBe(false);
  });

  test('the thumbnail is the photo the rider fills the most', async () => {
    const win = boot();
    await settle();
    pickTab(win, 'Master Men 35+');
    const thumb = board(win).querySelector('button[data-bib="204"] img');
    // A kit match at 0.4 of the frame beats a read number at 0.2.
    expect(thumb.getAttribute('src')).toMatch(/thumbnails\/menB\.jpg$/);
  });
});
