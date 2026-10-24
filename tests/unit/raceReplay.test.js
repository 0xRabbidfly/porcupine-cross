/**
 * Race Replay Unit Tests
 */

import RaceReplay, {
  lapEnds,
  progressAt,
  measureRoute,
  pointAt,
  clock,
  standingsAt,
} from '../../js/components/raceReplay.js';

// A square course 400 units round; Cat A is three riders over two laps, and
// Cat B one rider with no photo.
const race = {
  record: { race: 'Cat A', bib: '55', name: '', lap: 2, time: 100 },
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
    'Cat B': {
      title: 'Men Cat B',
      laps: 1,
      riders: [{ bib: '127', place: 1, laps: [150] }],
      podium: {},
    },
    'Cat A': {
      title: 'Men Cat A',
      laps: 2,
      riders: [
        { bib: '55', place: 1, laps: [100, 100], ranks: [1, 1], photo: '55.jpg' },
        { bib: '21', place: 2, laps: [110, 100], ranks: [2, 1], photo: '21.jpg' },
        { bib: '36', status: 'DNF', laps: [120, 150], photo: '36.jpg' },
      ],
      podium: { 55: 'podium-55.jpg', 21: 'podium-21.jpg' },
      fastest: { bib: '55', lap: 2, time: 100 },
    },
  },
};

describe('race replay maths', () => {
  test('lap ends run from the start', () => {
    expect(lapEnds([100, 110, 90])).toEqual([100, 210, 300]);
  });

  test('progress is whole laps plus the share of the current one', () => {
    expect(progressAt([100, 200], 50)).toEqual({ progress: 0.5, done: false });
    expect(progressAt([100, 200], 200)).toEqual({ progress: 1.5, done: false });
    expect(progressAt([100, 200], 300)).toEqual({ progress: 2, done: true });
  });

  test('a point is found by its share of the way round', () => {
    const route = measureRoute(race.course.route);
    expect(route.total).toBe(400);
    expect(pointAt(route, 0)).toEqual([0, 0]);
    expect(pointAt(route, 0.375)).toEqual([100, 50]);
    // A share past one lap wraps round.
    expect(pointAt(route, 1.75)).toEqual([0, 100]);
  });

  test('the clock reads as a race clock', () => {
    expect(clock(73)).toBe('1:13');
    expect(clock(3725)).toBe('1:02:05');
  });

  test('standings rank by distance, gap at the last line, the stopped at the bottom', () => {
    const { riders } = race.races['Cat A'];
    const mid = standingsAt(riders, 150);
    expect(mid.map(row => row.rider.bib)).toEqual(['55', '21', '36']);
    expect(mid.map(row => row.gap)).toEqual(['', '+0:10', '+0:20']);

    const late = standingsAt(riders, 300);
    expect(late.map(row => row.rider.bib)).toEqual(['55', '21', '36']);
    expect(late[0].finished).toBe(true);
    expect(late[2]).toMatchObject({ out: true, gap: 'DNF' });
  });
});

describe('RaceReplay', () => {
  let replay;
  let frames;

  beforeEach(() => {
    document.body.innerHTML = `
      <button type="button" data-replay="Cat A">Watch the race</button>
      <div class="race-replay" data-src="/photos/event-2026/replay/replay.json" hidden></div>
    `;
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => race }));
    frames = [];
    global.requestAnimationFrame = jest.fn(fn => frames.push(fn));
    global.cancelAnimationFrame = jest.fn();
    replay = RaceReplay.create();
  });

  afterEach(() => {
    replay.destroy();
    document.body.innerHTML = '';
    delete global.fetch;
  });

  const container = () => document.querySelector('.race-replay');
  const open = async () => {
    document.querySelector('[data-replay]').click();
    await new Promise(resolve => setTimeout(resolve, 0));
  };
  const rows = () =>
    Array.from(container().querySelectorAll('.replay-row')).map(row =>
      row.textContent.replace(/\s+/g, ' ').trim()
    );

  test('does nothing on a page without a replay', () => {
    document.body.innerHTML = '';
    expect(RaceReplay.create()).toBeNull();
  });

  test('opens on its button with a marker and a row per rider, and plays', async () => {
    await open();
    expect(global.fetch).toHaveBeenCalledWith('/photos/event-2026/replay/replay.json');
    expect(container().hidden).toBe(false);
    expect(container().querySelectorAll('.replay-rider')).toHaveLength(3);
    expect(container().querySelector('[data-bib="55"] image').getAttribute('href')).toBe(
      '/photos/event-2026/replay/55.jpg'
    );
    expect(rows()).toHaveLength(3);
    expect(container().querySelector('.replay-play').getAttribute('aria-label')).toBe('Pause');
    expect(frames).toHaveLength(1);
  });

  test('race time moves with the frames at the chosen speed', async () => {
    await open();
    frames.shift()(1000);
    frames.shift()(1100);
    // 0.1s of frames at 60x is six seconds of race.
    expect(replay.t).toBeCloseTo(6);
    expect(container().querySelector('.replay-time').textContent).toBe('0:06');
  });

  test('scrubbing pauses and moves the riders and the standings', async () => {
    await open();
    const scrub = container().querySelector('.replay-scrub');
    scrub.value = '150';
    scrub.dispatchEvent(new Event('input'));
    expect(replay.playing).toBe(false);
    expect(container().querySelector('.replay-lap').textContent).toBe('Lap 2 of 2');
    expect(rows()).toEqual(['1 55 Lap 2', '2 21 Lap 2 +0:10', '3 36 Lap 2 +0:20']);
    // 55 is half way round lap two: the far corner of the square.
    expect(container().querySelector('[data-bib="55"]').getAttribute('transform')).toMatch(
      /^translate\(100\.0 100\.0\)/
    );
  });

  test('the podium follows the finish, second, first and third', async () => {
    await open();
    replay.seek(400);
    const podium = container().querySelector('.replay-podium');
    expect(podium.hidden).toBe(false);
    const bibs = Array.from(podium.querySelectorAll('.podium-bib')).map(b => b.textContent);
    expect(bibs).toEqual(['21', '55']);
    expect(podium.querySelector('.podium-1 img').getAttribute('src')).toBe(
      '/photos/event-2026/replay/podium-55.jpg'
    );
    expect(podium.querySelector('.podium-2 .podium-time').textContent).toBe('+0:10');

    // The podium has its own way out.
    podium.querySelector('.podium-close').click();
    expect(container().hidden).toBe(true);
  });

  test('a named rider rides by name in the standings and on the podium', async () => {
    race.races['Cat A'].riders[0].name = 'Ethan Pauly';
    try {
      await open();
      const row = container().querySelector('.replay-row[data-bib="55"]');
      expect(row.querySelector('.replay-row-name').textContent).toBe('Ethan Pauly');
      expect(row.querySelector('.replay-row-bib').textContent).toBe('55');
      // The map keeps the bib.
      expect(
        container().querySelector('.replay-rider[data-bib="55"] .replay-bib').textContent
      ).toBe('55');
      replay.seek(400);
      expect(container().querySelector('.podium-1 .podium-bib').textContent).toBe('Ethan Pauly');
    } finally {
      delete race.races['Cat A'].riders[0].name;
    }
  });

  test('the course record sits on the map, and bursts when it is ridden', async () => {
    await open();
    const trophy = container().querySelector('.replay-trophy');
    expect(trophy.textContent.replace(/\s+/g, ' ').trim()).toBe('🏆 Course record 1:40 #55');
    const burst = container().querySelector('.replay-burst');
    expect(burst.hidden).toBe(true);
    // Playing through 200s, when 55 ends lap two.
    replay.seek(190);
    replay.seek(205);
    expect(burst.hidden).toBe(false);
    expect(burst.textContent).toBe('Course record! 55, 1:40');
    // Scrubbed (paused) through the same moment, it stays quiet.
    burst.hidden = true;
    replay.pause();
    replay.seek(190);
    replay.seek(205);
    expect(burst.hidden).toBe(true);
  });

  test("a race's winner gets a burst as they cross the line", async () => {
    await open();
    const pick = container().querySelector('.replay-pick select');
    pick.value = 'Cat B';
    pick.dispatchEvent(new Event('change'));
    await new Promise(resolve => setTimeout(resolve, 0));
    replay.seek(140);
    replay.seek(155);
    const burst = container().querySelector('.replay-burst');
    expect(burst.hidden).toBe(false);
    expect(burst.dataset.kind).toBe('win');
    expect(burst.textContent).toBe('Winner! 127, 2:30');
  });

  test("the title bar carries the race's lap record", async () => {
    await open();
    expect(container().querySelector('.replay-record').textContent).toBe(
      'Fastest lap 1:40 by 55 on lap 2'
    );
  });

  test('a button on a closed results bar opens the replay, not the bar', async () => {
    document.body.insertAdjacentHTML(
      'afterbegin',
      '<details><summary>Results <button type="button" data-replay="Cat A">Watch</button></summary></details>'
    );
    document.querySelector('summary [data-replay]').click();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(document.querySelector('details').open).toBe(false);
    expect(container().hidden).toBe(false);
  });

  test('offers a slow 10x speed among the speeds', async () => {
    await open();
    const speeds = Array.from(container().querySelectorAll('.replay-speed button')).map(
      button => button.textContent
    );
    expect(speeds).toEqual(['10×', '30×', '60×', '120×']);
    container().querySelector('[data-speed="10"]').click();
    frames.shift()(1000);
    frames.shift()(1100);
    expect(replay.t).toBeCloseTo(1);
  });

  test('picking a rider in the standings follows them with a halo, and again lets go', async () => {
    await open();
    const row = () => container().querySelector('.replay-row[data-bib="21"]');
    row().querySelector('.replay-follow').click();
    expect(container().querySelector('.replay-rider[data-bib="21"]').classList).toContain(
      'is-followed'
    );
    expect(row().classList).toContain('is-followed');
    expect(row().querySelector('.replay-follow').getAttribute('aria-pressed')).toBe('true');
    // Followed riders ride on top of the others.
    expect(container().querySelector('.replay-riders').lastElementChild.dataset.bib).toBe('21');

    row().querySelector('.replay-follow').click();
    expect(container().querySelectorAll('.is-followed')).toHaveLength(0);
  });

  test('paused, pointing at a rider shows their photo large; playing, it does not', async () => {
    await open();
    const point = bib =>
      container()
        .querySelector(`.replay-rider[data-bib="${bib}"] image`)
        .dispatchEvent(new MouseEvent('pointerover', { bubbles: true }));
    const zoom = () => container().querySelector('.replay-zoom');

    point('55');
    expect(zoom().hidden).toBe(true);

    container().querySelector('.replay-play').click();
    replay.seek(150);
    point('55');
    expect(zoom().hidden).toBe(false);
    expect(zoom().querySelector('img').getAttribute('src')).toBe(
      '/photos/event-2026/replay/55.jpg'
    );
    expect(zoom().textContent.replace(/\s+/g, ' ').trim()).toBe('55 1st on lap 2');

    container().querySelector('.replay-play').click();
    expect(zoom().hidden).toBe(true);
  });

  test('the title picks the race, and switching starts it over', async () => {
    await open();
    const pick = container().querySelector('.replay-pick select');
    expect(Array.from(pick.options).map(o => o.textContent)).toEqual(['Men Cat B', 'Men Cat A']);
    expect(pick.value).toBe('Cat A');

    pick.value = 'Cat B';
    pick.dispatchEvent(new Event('change'));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(container().querySelectorAll('.replay-rider')).toHaveLength(1);
    expect(container().querySelector('.replay-pick select').value).toBe('Cat B');
    expect(replay.t).toBe(0);
  });

  test('a rider with no photo rides as their number, here and on the podium', async () => {
    await open();
    const pick = container().querySelector('.replay-pick select');
    pick.value = 'Cat B';
    pick.dispatchEvent(new Event('change'));
    await new Promise(resolve => setTimeout(resolve, 0));
    const marker = container().querySelector('.replay-rider[data-bib="127"]');
    expect(marker.querySelector('image')).toBeNull();
    expect(marker.querySelector('.replay-noface-bib').textContent).toBe('127');
    expect(container().querySelector('.replay-row-noface')).not.toBeNull();
    replay.seek(400);
    expect(container().querySelector('.podium-1 .podium-nophoto').textContent).toBe('127');
  });

  test('a link with ?replay= opens on that race, and closing drops it from the address', async () => {
    replay.destroy();
    window.history.replaceState(null, '', '/photos.html?replay=Cat%20B');
    replay = RaceReplay.create();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(container().hidden).toBe(false);
    expect(container().querySelector('.replay-pick select').value).toBe('Cat B');

    container().querySelector('.replay-close').click();
    expect(window.location.search).toBe('');
  });

  test('following a rider shows their laps, filling in as they cross the line', async () => {
    await open();
    container().querySelector('.replay-row[data-bib="55"] .replay-follow').click();
    const info = () => container().querySelector('.replay-info');
    const cells = name =>
      Array.from(info().querySelectorAll('tbody tr'))
        .find(tr => tr.querySelector('th').textContent === name)
        .querySelectorAll('td');
    expect(info().hidden).toBe(false);
    expect(info().querySelector('.replay-info-bib').textContent).toBe('55');

    replay.seek(150);
    expect(Array.from(cells('Time')).map(td => td.textContent)).toEqual(['1:40', '']);
    expect(Array.from(cells('Rank')).map(td => td.textContent)).toEqual(['1st', '']);
    expect(cells('Time')[1].classList).toContain('is-now');

    replay.seek(250);
    expect(Array.from(cells('Time')).map(td => td.textContent)).toEqual(['1:40', '1:40★']);
    expect(info().querySelector('.replay-info-status').textContent).toBe('1st, 3:20');

    info().querySelector('.replay-info-close').click();
    expect(info().hidden).toBe(true);
    expect(container().querySelectorAll('.is-followed')).toHaveLength(0);
  });

  test('Escape closes it, stops the clock and hands focus back', async () => {
    await open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(container().hidden).toBe(true);
    expect(container().innerHTML).toBe('');
    expect(global.cancelAnimationFrame).toHaveBeenCalled();
    expect(document.activeElement).toBe(document.querySelector('[data-replay]'));
  });
});
