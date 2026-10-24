/**
 * Replay Teaser Unit Tests
 */

import ReplayTeaser from '../../js/components/replayTeaser.js';

// A square course 400 units round; two riders, one without a photo.
const data = {
  course: {
    map: { src: '/images/map.jpg', width: 200, height: 200 },
    route: [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ],
  },
  races: {
    'Cat A': {
      title: 'Men Cat A',
      laps: 2,
      riders: [
        { bib: '55', place: 1, laps: [100, 100], photo: '55.jpg' },
        { bib: '127', place: 2, laps: [120, 100] },
      ],
      podium: {},
    },
  },
};

describe('ReplayTeaser', () => {
  let teasers;
  let frames;
  let observed;

  const mount = async (respond = () => ({ ok: true, json: async () => data })) => {
    global.fetch = jest.fn(() => Promise.resolve(respond()));
    teasers = ReplayTeaser.createAll();
    await teasers[0].ready;
    return document.querySelector('.replay-teaser');
  };

  beforeEach(() => {
    document.body.innerHTML = `
      <a class="replay-teaser" href="photos.html?replay=Cat%20A" data-replay="Cat A"
         data-src="/photos/event-2026/replay/replay.json">
        <div class="teaser-stage"><span class="teaser-lap"></span></div>
      </a>`;
    frames = [];
    global.requestAnimationFrame = jest.fn(fn => frames.push(fn));
    global.cancelAnimationFrame = jest.fn();
    observed = null;
    global.IntersectionObserver = class {
      constructor(callback) {
        observed = callback;
      }
      observe() {}
      disconnect() {}
    };
    window.matchMedia = jest.fn(() => ({ matches: false }));
  });

  afterEach(() => {
    teasers.forEach(teaser => teaser.destroy());
    document.body.innerHTML = '';
    delete global.fetch;
    delete global.IntersectionObserver;
  });

  test('draws the course and a marker per rider, the photo-less as their number', async () => {
    const teaser = await mount();
    expect(global.fetch).toHaveBeenCalledWith('/photos/event-2026/replay/replay.json');
    expect(teaser.querySelector('.teaser-course')).not.toBeNull();
    const riders = teaser.querySelectorAll('.teaser-rider');
    expect(riders).toHaveLength(2);
    expect(teaser.querySelector('.teaser-rider image').getAttribute('href')).toBe(
      '/photos/event-2026/replay/55.jpg'
    );
    expect(teaser.querySelector('.teaser-noface-bib').textContent).toBe('127');
  });

  test('loops only while on screen, with the leader on lap counts', async () => {
    const teaser = await mount();
    expect(frames).toHaveLength(0);

    observed([{ isIntersecting: true }]);
    expect(frames).toHaveLength(1);
    frames.shift()(1000);
    // Three quarters of the loop is 157.5s of the 210s race: 55 is on lap two.
    frames.shift()(1000 + (36000 * 3) / 4);
    expect(teaser.querySelector('.teaser-lap').textContent).toBe('Lap 2 of 2');
    expect(teaser.querySelector('.teaser-rider.is-leader')).not.toBeNull();

    observed([{ isIntersecting: false }]);
    expect(global.cancelAnimationFrame).toHaveBeenCalled();
  });

  test('holds a still frame for reduced motion', async () => {
    window.matchMedia = jest.fn(() => ({ matches: true }));
    const teaser = await mount();
    expect(frames).toHaveLength(0);
    expect(teaser.querySelector('.teaser-lap').textContent).toBe('Lap 1 of 2');
  });

  test('stays a plain link when the race data does not load', async () => {
    const teaser = await mount(() => ({ ok: false, status: 404 }));
    expect(teaser.classList).toContain('is-static');
    expect(teaser.querySelector('.teaser-rider')).toBeNull();
    expect(teaser.getAttribute('href')).toBe('photos.html?replay=Cat%20A');
  });
});
