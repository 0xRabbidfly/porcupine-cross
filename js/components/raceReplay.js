/**
 * Race Replay Component
 *
 * Replays one category's race on the course map from each rider's lap times:
 * every rider is their own photo, moving round the course at the pace of the
 * lap they were on, with the standings beside the map and the podium at the
 * end. A rider's speed is even within a lap, so they are exactly where the
 * timing put them each time they crossed the line, and close to it between.
 *
 * Opened by any `[data-replay="<category>"]` button on the page. The data is a
 * JSON file named by the container's `data-src`: the course as a path in the
 * map's pixels, and each rider's lap times by bib number. Bib numbers only.
 *
 * The clock is a requestAnimationFrame loop rather than AnimationSystem, which
 * runs CSS animations on elements; this one advances race time frame by frame.
 */

const SVG = 'http://www.w3.org/2000/svg';
const SPEEDS = [10, 30, 60, 120];
const RADIUS = 22;
// The race clock holds at the finish this long before the podium comes up.
const PODIUM_DELAY_S = 4;

/** Each lap's finishing time, from the start, in seconds. */
export function lapEnds(laps) {
  let total = 0;
  return laps.map(lap => (total += lap));
}

/**
 * How far round the race a rider is at a moment: whole laps done plus the
 * share of the current lap, from an even pace within it.
 * @returns {{progress: number, done: boolean}} done once their race is over
 */
export function progressAt(laps, t) {
  const ends = lapEnds(laps);
  if (!laps.length || t >= ends[ends.length - 1]) return { progress: laps.length, done: true };
  const lap = ends.findIndex(end => end > t);
  const start = lap ? ends[lap - 1] : 0;
  return { progress: lap + (Math.max(0, t) - start) / laps[lap], done: false };
}

/** A route with its running lengths, for finding a point by share of a lap. */
export function measureRoute(points) {
  const closed = [...points, points[0]];
  const lengths = [0];
  for (let i = 1; i < closed.length; i++) {
    const [x0, y0] = closed[i - 1];
    const [x1, y1] = closed[i];
    lengths.push(lengths[i - 1] + Math.hypot(x1 - x0, y1 - y0));
  }
  return { points: closed, lengths, total: lengths[lengths.length - 1] };
}

/** The point a share of the way round a measured route, 0 to 1. */
export function pointAt(route, share) {
  const along = (((share % 1) + 1) % 1) * route.total;
  let i = 1;
  while (i < route.lengths.length - 1 && route.lengths[i] < along) i++;
  const span = route.lengths[i] - route.lengths[i - 1] || 1;
  const k = (along - route.lengths[i - 1]) / span;
  const [x0, y0] = route.points[i - 1];
  const [x1, y1] = route.points[i];
  return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
}

/** 1 -> "1st", 22 -> "22nd", 13 -> "13th". */
export function ordinal(n) {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
  return `${n}${suffix}`;
}

/** 73 -> "1:13", 3725 -> "1:02:05". */
export function clock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/**
 * The order at a moment. Riders still racing or finished rank by distance
 * covered, a finished rider by when they finished; a rider who stopped drops
 * to the bottom once they do. The gap is to the leader at the last line both
 * have crossed, from the timing.
 */
export function standingsAt(riders, t) {
  const rows = riders.map(rider => {
    const { progress, done } = progressAt(rider.laps, t);
    const ends = lapEnds(rider.laps);
    return {
      rider,
      progress,
      ends,
      finished: done && Boolean(rider.place),
      out: done && !rider.place,
      at: done ? ends[ends.length - 1] : t,
    };
  });
  rows.sort((a, b) => {
    if (a.out !== b.out) return a.out ? 1 : -1;
    if (a.out) return b.progress - a.progress || a.at - b.at;
    return b.progress - a.progress || a.at - b.at;
  });
  const leader = rows[0];
  rows.forEach((row, i) => {
    row.position = i + 1;
    const lapsDone = Math.floor(row.progress);
    if (row.out) row.gap = row.rider.status || 'Out';
    else if (row === leader || lapsDone === 0) row.gap = '';
    else if (leader.progress - row.progress >= 1) {
      const down = Math.floor(leader.progress - row.progress);
      row.gap = down === 1 ? '1 lap' : `${down} laps`;
    } else {
      const behind = row.ends[lapsDone - 1] - leader.ends[lapsDone - 1];
      row.gap = behind > 0 ? `+${clock(behind)}` : 'Level';
    }
  });
  return rows;
}

class RaceReplay {
  /**
   * @param {HTMLElement} container - Empty element with `data-src`, hidden
   */
  constructor(container) {
    this.container = container;
    this.src = container.dataset.src;
    this.base = this.src.replace(/[^/]*$/, '');
    this.data = null;
    this.race = null;
    this.t = 0;
    this.speed = 60;
    this.playing = false;
    this.frame = null;
    this.lastStamp = null;
    this.podiumShown = false;
    this.order = '';
    this.opener = null;
    this.onClick = this.onClick.bind(this);
    this.onKey = this.onKey.bind(this);
    this.tick = this.tick.bind(this);
    this.onResize = () => {
      this.fitView();
      this.draw();
    };
  }

  /**
   * Wire up the first matching container on the page
   * @param {string} selector - Container selector
   * @returns {RaceReplay|null} Instance, or null when the page has none
   */
  static create(selector = '.race-replay') {
    const container = document.querySelector(selector);
    return container ? new RaceReplay(container).init() : null;
  }

  init() {
    document.addEventListener('click', this.onClick);
    return this;
  }

  onClick(event) {
    const button = event.target.closest('[data-replay]');
    if (button) {
      // A button on a <details> summary opens the replay, not the details.
      event.preventDefault();
      this.opener = button;
      this.open(button.dataset.replay);
    }
  }

  onKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    } else if (event.key === ' ' && !event.target.closest('button, input')) {
      event.preventDefault();
      this.toggle();
    }
  }

  async load() {
    if (!this.data) {
      const response = await fetch(this.src);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.data = await response.json();
    }
    return this.data;
  }

  async open(category) {
    const data = await this.load();
    const race = data[category];
    if (!race) return;
    this.race = {
      ...race,
      category,
      measured: measureRoute(race.route),
      end: Math.max(...race.riders.map(rider => lapEnds(rider.laps).pop())),
    };
    this.container.hidden = false;
    this.render();
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', this.onKey);
    window.addEventListener('resize', this.onResize);
    this.seek(0);
    this.play();
    this.container.querySelector('.replay-play').focus();
  }

  close() {
    this.pause();
    this.container.hidden = true;
    this.container.innerHTML = '';
    document.body.style.overflow = '';
    document.removeEventListener('keydown', this.onKey);
    window.removeEventListener('resize', this.onResize);
    if (this.opener && this.opener.isConnected) this.opener.focus();
  }

  destroy() {
    this.close();
    document.removeEventListener('click', this.onClick);
  }

  play() {
    if (this.t >= this.race.end + PODIUM_DELAY_S) this.seek(0);
    this.playing = true;
    this.lastStamp = null;
    this.hideZoom();
    this.updatePlayButton();
    if (!this.frame) this.frame = requestAnimationFrame(this.tick);
  }

  pause() {
    this.playing = false;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = null;
    if (this.race) this.updatePlayButton();
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  tick(stamp) {
    this.frame = null;
    if (!this.playing) return;
    if (this.lastStamp !== null) {
      // A long gap (a background tab) is not race time.
      const step = Math.min(stamp - this.lastStamp, 100);
      this.seek(this.t + (step / 1000) * this.speed);
    }
    this.lastStamp = stamp;
    if (this.t >= this.race.end + PODIUM_DELAY_S) {
      this.pause();
      return;
    }
    this.frame = requestAnimationFrame(this.tick);
  }

  /** Moves the race to a moment, in seconds from the start. */
  seek(t) {
    this.t = Math.max(0, Math.min(t, this.race.end + PODIUM_DELAY_S));
    this.draw();
  }

  setSpeed(speed) {
    this.speed = speed;
    this.container.querySelectorAll('.replay-speed button').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.speed) === speed));
    });
  }

  updatePlayButton() {
    const button = this.container.querySelector('.replay-play');
    if (!button) return;
    button.setAttribute('aria-label', this.playing ? 'Pause' : 'Play');
    this.container.classList.toggle('is-paused', !this.playing);
    button.querySelector('i').className = `fas ${this.playing ? 'fa-pause' : 'fa-play'}`;
  }

  // The view: the map cropped to the course, darkened so the riders read, the
  // course drawn over it, and a marker per rider.
  render() {
    const race = this.race;
    const xs = race.route.map(([x]) => x);
    const ys = race.route.map(([, y]) => y);
    // Room round the course for a full-size marker on its edge, as far as
    // the map goes.
    const pad = RADIUS * 3;
    const box = [
      Math.max(0, Math.min(...xs) - pad),
      Math.max(0, Math.min(...ys) - pad),
      Math.min(race.map.width, Math.max(...xs) + pad),
      Math.min(race.map.height, Math.max(...ys) + pad),
    ];
    this.box = box;
    const path = race.route.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ') + ' Z';
    const [fx, fy] = race.route[0];

    this.container.innerHTML = `
      <div class="replay-frame" role="dialog" aria-modal="true" aria-labelledby="replay-title">
        <div class="replay-head">
          <h2 id="replay-title" class="replay-title">${race.title}, lap by lap</h2>
          <p class="replay-clock"><span class="replay-lap"></span> <span class="replay-time"></span></p>
          <button type="button" class="replay-close" aria-label="Close the replay">&times;</button>
        </div>
        <div class="replay-body">
          <div class="replay-stage">
            <svg class="replay-map" viewBox="${box[0]} ${box[1]} ${box[2] - box[0]} ${box[3] - box[1]}"
                 preserveAspectRatio="xMidYMid meet" role="img" aria-label="The course map with each rider on it">
              <defs>
                <clipPath id="replay-face"><circle r="${RADIUS}" /></clipPath>
              </defs>
              <image href="${race.map.src}" width="${race.map.width}" height="${race.map.height}" />
              <rect class="replay-dim" width="${race.map.width}" height="${race.map.height}" />
              <path class="replay-course" d="${path}" />
              <g class="replay-line" transform="translate(${fx} ${fy})">
                <rect x="-16" y="-5" width="32" height="10" />
              </g>
              <g class="replay-riders"></g>
            </svg>
            <div class="replay-zoom" hidden>
              <img alt="" />
              <p><b class="replay-zoom-bib"></b> <span class="replay-zoom-text"></span></p>
            </div>
          </div>
          <ol class="replay-standings" aria-label="Standings: pick a rider to follow"></ol>
        </div>
        <div class="replay-controls">
          <button type="button" class="replay-play" aria-label="Pause"><i class="fas fa-pause" aria-hidden="true"></i></button>
          <input type="range" class="replay-scrub" min="0" max="${Math.ceil(race.end)}" step="1" value="0" aria-label="Race time" />
          <div class="replay-speed" role="group" aria-label="Speed">
            ${SPEEDS.map(s => `<button type="button" data-speed="${s}" aria-pressed="${s === this.speed}">${s}×</button>`).join('')}
          </div>
        </div>
        <div class="replay-podium" hidden></div>
      </div>`;

    const riders = this.container.querySelector('.replay-riders');
    this.markers = new Map();
    this.markerScale = 1;
    race.riders.forEach(rider => {
      const g = document.createElementNS(SVG, 'g');
      g.setAttribute('class', 'replay-rider');
      g.dataset.bib = rider.bib;
      g.innerHTML = `
        <circle class="replay-glow" r="${RADIUS + 9}" />
        <circle class="replay-halo" r="${RADIUS + 9}" />
        <circle class="replay-halo replay-halo-late" r="${RADIUS + 9}" />
        <circle class="replay-ring" r="${RADIUS + 3}" />
        <image href="${this.base}${rider.photo}" x="${-RADIUS}" y="${-RADIUS}" width="${RADIUS * 2}" height="${RADIUS * 2}"
               clip-path="url(#replay-face)" preserveAspectRatio="xMidYMid slice" />
        <rect class="replay-tag" x="-15" y="${RADIUS - 2}" width="30" height="17" rx="3" />
        <text class="replay-bib" y="${RADIUS + 11}">${rider.bib}</text>`;
      riders.appendChild(g);
      this.markers.set(rider.bib, g);
    });

    const standings = this.container.querySelector('.replay-standings');
    this.rows = new Map();
    race.riders.forEach(rider => {
      const li = document.createElement('li');
      li.className = 'replay-row';
      li.dataset.bib = rider.bib;
      li.innerHTML = `
        <button type="button" class="replay-follow" aria-pressed="false" aria-label="Follow bib ${rider.bib}">
          <span class="replay-pos"></span>
          <img src="${this.base}${rider.photo}" alt="" />
          <b class="replay-row-bib">${rider.bib}</b>
          <span class="replay-row-lap"></span>
          <span class="replay-gap"></span>
        </button>`;
      standings.appendChild(li);
      this.rows.set(rider.bib, li);
    });

    const scrub = this.container.querySelector('.replay-scrub');
    scrub.addEventListener('input', () => {
      this.pause();
      this.seek(Number(scrub.value));
    });
    this.container.querySelector('.replay-play').addEventListener('click', () => this.toggle());
    this.container.querySelector('.replay-close').addEventListener('click', () => this.close());
    this.container.querySelectorAll('.replay-speed button').forEach(button => {
      button.addEventListener('click', () => this.setSpeed(Number(button.dataset.speed)));
    });

    // A click on a rider, in the standings or on the map, follows them. Paused,
    // pointing at one shows their photo large; on a touch screen, a tap on the
    // map does.
    const bibOf = event => {
      const hit = event.target.closest('.replay-rider, .replay-row');
      return hit ? hit.dataset.bib : null;
    };
    [riders, standings].forEach(layer => {
      layer.addEventListener('pointerover', event => {
        const bib = bibOf(event);
        if (bib && !this.playing && event.pointerType !== 'touch') this.showZoom(bib);
      });
      layer.addEventListener('pointerout', event => {
        if (event.pointerType === 'touch') return;
        const into = event.relatedTarget;
        const next = into && into.closest ? into.closest('.replay-rider, .replay-row') : null;
        if (!next || next.dataset.bib !== this.zoomBib) this.hideZoom();
      });
    });
    standings.addEventListener('click', event => {
      const bib = bibOf(event);
      if (bib) this.follow(bib);
    });
    riders.addEventListener('pointerup', event => {
      const bib = bibOf(event);
      if (!bib) return;
      if (event.pointerType === 'touch' && !this.playing) {
        if (bib === this.zoomBib) this.hideZoom();
        else this.showZoom(bib);
      } else {
        this.follow(bib);
      }
    });
    this.zoomBib = null;
    this.followed = null;
    this.order = '';
    this.podiumShown = false;
    this.fitView();
  }

  // A stage wider than the course shows more of the map either side rather
  // than empty bands, as far as the map goes. On a narrow screen the map draws
  // small, so the riders grow until a face reads at about 34px across.
  fitView() {
    const svg = this.container.querySelector('.replay-map');
    const stage = svg.getBoundingClientRect();
    const [, y0, , y1] = this.box;
    let [x0, , x1] = this.box;
    const { width: mapWidth } = this.race.map;
    if (stage.width && stage.height && stage.width / stage.height > (x1 - x0) / (y1 - y0)) {
      const wide = ((y1 - y0) * stage.width) / stage.height;
      x0 -= (wide - (x1 - x0)) / 2;
      x0 = Math.max(0, Math.min(x0, mapWidth - wide));
      x1 = x0 + wide;
    }
    svg.setAttribute('viewBox', `${x0} ${y0} ${x1 - x0} ${y1 - y0}`);
    const scale = stage.width ? stage.width / (x1 - x0) : 1;
    this.markerScale = Math.min(1.8, Math.max(1, 17 / (RADIUS * scale)));
  }

  draw() {
    const race = this.race;
    const rows = standingsAt(race.riders, this.t);
    const leader = rows[0];

    rows.forEach(row => {
      const marker = this.markers.get(row.rider.bib);
      const [x, y] = pointAt(race.measured, row.progress);
      marker.setAttribute(
        'transform',
        `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${
          this.markerScale * (row.rider.bib === this.followed ? 1.25 : 1)
        })`
      );
      marker.classList.toggle('is-leader', row === leader && !row.finished);
      marker.classList.toggle('is-gone', row.finished || row.out);

      const li = this.rows.get(row.rider.bib);
      li.querySelector('.replay-pos').textContent = row.out ? '' : String(row.position);
      li.querySelector('.replay-gap').textContent = row.finished
        ? row === leader
          ? clock(row.at)
          : row.gap || clock(row.at)
        : row.gap;
      li.querySelector('.replay-row-lap').textContent =
        row.finished || row.out
          ? ''
          : `Lap ${Math.min(Math.floor(row.progress) + 1, row.rider.laps.length)}`;
      li.classList.toggle('is-out', row.out);
      li.classList.toggle('is-finished', row.finished);
    });
    this.rowsNow = rows;

    // Re-order only when the order changes: leaders drawn last, on top.
    const order = rows.map(row => row.rider.bib).join(',');
    if (order !== this.order) {
      this.order = order;
      const list = this.container.querySelector('.replay-standings');
      const layer = this.container.querySelector('.replay-riders');
      rows.forEach(row => list.appendChild(this.rows.get(row.rider.bib)));
      [...rows].reverse().forEach(row => layer.appendChild(this.markers.get(row.rider.bib)));
      // The followed rider rides on top of everyone.
      if (this.followed) layer.appendChild(this.markers.get(this.followed));
    }

    const lap = Math.min(Math.floor(leader.progress) + 1, race.laps);
    this.container.querySelector('.replay-lap').textContent = leader.finished
      ? 'Finished'
      : `Lap ${lap} of ${race.laps}`;
    this.container.querySelector('.replay-time').textContent = clock(Math.min(this.t, race.end));
    this.container.querySelector('.replay-scrub').value = String(
      Math.round(Math.min(this.t, race.end))
    );

    if (this.zoomBib) this.showZoom(this.zoomBib);

    const over = this.t >= race.end + PODIUM_DELAY_S;
    if (over !== this.podiumShown) this.showPodium(over);
  }

  // One rider at a time wears a halo on the map and is lit in the standings;
  // picking them again lets them go.
  follow(bib) {
    this.followed = this.followed === bib ? null : bib;
    this.markers.forEach((marker, key) => {
      marker.classList.toggle('is-followed', key === this.followed);
    });
    this.rows.forEach((li, key) => {
      li.classList.toggle('is-followed', key === this.followed);
      li.querySelector('.replay-follow').setAttribute(
        'aria-pressed',
        String(key === this.followed)
      );
    });
    if (this.followed) {
      this.container.querySelector('.replay-riders').appendChild(this.markers.get(this.followed));
    }
  }

  // The rider's photo large, beside their marker: above it when there is
  // room, kept inside the map. Their place and lap, or how their race ended.
  showZoom(bib) {
    const zoom = this.container.querySelector('.replay-zoom');
    const row = (this.rowsNow || []).find(r => r.rider.bib === bib);
    if (!zoom || !row) return;
    this.zoomBib = bib;
    zoom.querySelector('img').src = `${this.base}${row.rider.photo}`;
    zoom.querySelector('.replay-zoom-bib').textContent = bib;
    const lap = Math.min(Math.floor(row.progress) + 1, row.rider.laps.length);
    let text = `${ordinal(row.position)} on lap ${lap}`;
    if (row.finished) text = `${ordinal(row.rider.place)}, finished in ${clock(row.at)}`;
    if (row.out) text = `Did not finish, out after lap ${row.rider.laps.length}`;
    zoom.querySelector('.replay-zoom-text').textContent = text;
    zoom.hidden = false;
    this.markers.forEach((marker, key) => marker.classList.toggle('is-zoomed', key === bib));
    this.rows.forEach((li, key) => li.classList.toggle('is-zoomed', key === bib));

    const stage = this.container.querySelector('.replay-stage').getBoundingClientRect();
    const mark = this.markers.get(bib).getBoundingClientRect();
    const width = zoom.offsetWidth || 190;
    const height = zoom.offsetHeight || 230;
    const cx = mark.left + mark.width / 2 - stage.left;
    let top = mark.top - stage.top - height - 8;
    if (top < 6) top = mark.bottom - stage.top + 8;
    top = Math.max(6, Math.min(top, stage.height - height - 6));
    const left = Math.max(6, Math.min(cx - width / 2, stage.width - width - 6));
    zoom.style.left = `${left}px`;
    zoom.style.top = `${top}px`;
  }

  hideZoom() {
    this.zoomBib = null;
    const zoom = this.container.querySelector('.replay-zoom');
    if (zoom) zoom.hidden = true;
    if (this.markers) this.markers.forEach(marker => marker.classList.remove('is-zoomed'));
    if (this.rows) this.rows.forEach(li => li.classList.remove('is-zoomed'));
  }

  // The top three on the steps: second, first, third, each on the photo they
  // fill most, with their time or their gap to the winner.
  showPodium(show) {
    this.podiumShown = show;
    const podium = this.container.querySelector('.replay-podium');
    podium.hidden = !show;
    if (!show) {
      podium.innerHTML = '';
      return;
    }
    const top = this.race.riders
      .filter(rider => rider.place && rider.place <= 3)
      .sort((a, b) => a.place - b.place);
    const winner = lapEnds(top[0].laps).pop();
    const step = rider => {
      const time = lapEnds(rider.laps).pop();
      const photo = this.race.podium[rider.bib] || rider.photo;
      return `
        <figure class="podium-step podium-${rider.place}">
          <img src="${this.base}${photo}" alt="" />
          <figcaption>
            <b class="podium-bib">${rider.bib}</b>
            <span class="podium-time">${rider.place === 1 ? clock(time) : `+${clock(time - winner)}`}</span>
          </figcaption>
          <div class="podium-block"><span>${rider.place}</span></div>
        </figure>`;
    };
    const order = [top[1], top[0], top[2]].filter(Boolean);
    podium.innerHTML = `
      <h3 class="podium-title">${this.race.title} podium</h3>
      <div class="podium-steps">${order.map(step).join('')}</div>
      <button type="button" class="podium-again">Watch again</button>`;
    podium.querySelector('.podium-again').addEventListener('click', () => {
      this.seek(0);
      this.play();
    });
  }
}

export default RaceReplay;
