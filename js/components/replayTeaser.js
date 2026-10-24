/**
 * Replay Teaser Component
 *
 * The invitation to the race replays: the course map with one race's riders
 * looping round it as their own photos, a line on what the replay is, and a
 * big button. The teaser is a link carrying `data-replay`: on a page with the
 * replay player, that player opens in place; anywhere else the link goes to
 * the photos page with `?replay=`, which opens the player on arrival.
 *
 * It runs only while on screen and holds still for reduced motion. Its clock
 * is a requestAnimationFrame loop, like the replay's, not AnimationSystem.
 */

import { lapEnds, progressAt, measureRoute, pointAt } from './raceReplay.js';

const SVG = 'http://www.w3.org/2000/svg';
// The whole race once round in this long, then again.
const LOOP_MS = 36000;
const RADIUS = 26;

class ReplayTeaser {
  /**
   * @param {HTMLElement} element - The teaser link, with `data-src` and `data-replay`
   */
  constructor(element) {
    this.element = element;
    this.src = element.dataset.src;
    this.category = element.dataset.replay;
    this.base = this.src.replace(/[^/]*$/, '');
    this.stage = element.querySelector('.teaser-stage');
    this.frame = null;
    this.started = null;
    this.observer = null;
    this.tick = this.tick.bind(this);
  }

  /**
   * Start every teaser on the page
   * @param {string} selector - Teaser selector
   * @returns {ReplayTeaser[]} Instances, one per teaser
   */
  static createAll(selector = '.replay-teaser') {
    return Array.from(document.querySelectorAll(selector)).map(element =>
      new ReplayTeaser(element).init()
    );
  }

  init() {
    this.ready = this.load().catch(error => {
      // Without the data the teaser is still a link, with the map as a picture.
      console.warn('Replay teaser has no race to show', error);
      this.element.classList.add('is-static');
    });
    return this;
  }

  async load() {
    const response = await fetch(this.src);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const race = data.races[this.category];
    if (!race) throw new Error(`No replay for ${this.category}`);
    this.race = race;
    this.route = measureRoute(data.course.route);
    this.end = Math.max(...race.riders.map(rider => lapEnds(rider.laps).pop()));
    this.render(data.course);

    const still =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) {
      this.draw(this.end * 0.45);
      return;
    }
    this.draw(0);
    if (typeof IntersectionObserver === 'undefined') {
      this.start();
      return;
    }
    this.observer = new IntersectionObserver(entries => {
      if (entries[entries.length - 1].isIntersecting) this.start();
      else this.stop();
    });
    this.observer.observe(this.element);
  }

  // The map cropped to the course and darkened, the course over it, and the
  // riders: each their photo in a ring, or their number when there is none.
  render(course) {
    const xs = course.route.map(([x]) => x);
    const ys = course.route.map(([, y]) => y);
    const pad = RADIUS * 2;
    const box = [
      Math.min(...xs) - pad,
      Math.min(...ys) - pad,
      Math.max(...xs) + pad,
      Math.max(...ys) + pad,
    ];
    const path = course.route.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ') + ' Z';

    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'teaser-map');
    svg.setAttribute('viewBox', `${box[0]} ${box[1]} ${box[2] - box[0]} ${box[3] - box[1]}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.innerHTML = `
      <defs><clipPath id="teaser-face"><circle r="${RADIUS}" /></clipPath></defs>
      <image href="${course.map.src}" width="${course.map.width}" height="${course.map.height}" />
      <rect class="teaser-dim" width="${course.map.width}" height="${course.map.height}" />
      <path class="teaser-course" d="${path}" />
      <g class="teaser-riders"></g>`;
    const layer = svg.querySelector('.teaser-riders');
    this.markers = this.race.riders.map(rider => {
      const g = document.createElementNS(SVG, 'g');
      g.setAttribute('class', 'teaser-rider');
      g.innerHTML = `
        <circle class="teaser-ring" r="${RADIUS + 4}" />
        ${
          rider.photo
            ? `<image href="${this.base}${rider.photo}" x="${-RADIUS}" y="${-RADIUS}" width="${RADIUS * 2}" height="${RADIUS * 2}"
                 clip-path="url(#teaser-face)" preserveAspectRatio="xMidYMid slice" />`
            : `<circle class="teaser-noface" r="${RADIUS}" /><text class="teaser-noface-bib" y="7">${rider.bib}</text>`
        }`;
      layer.appendChild(g);
      return { rider, g };
    });
    this.stage.prepend(svg);
    this.lap = this.stage.querySelector('.teaser-lap');
  }

  start() {
    if (!this.frame) this.frame = requestAnimationFrame(this.tick);
  }

  stop() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = null;
    // Pick up where it left off when it comes back on screen.
    this.started = null;
  }

  tick(stamp) {
    if (this.started === null) this.started = stamp - (this.elapsed || 0);
    this.elapsed = (stamp - this.started) % LOOP_MS;
    this.draw((this.elapsed / LOOP_MS) * this.end);
    this.frame = requestAnimationFrame(this.tick);
  }

  /** Puts every rider where they were at a moment of the race, in seconds. */
  draw(t) {
    let leader = null;
    this.markers.forEach(marker => {
      const { progress, done } = progressAt(marker.rider.laps, t);
      marker.progress = progress;
      const [x, y] = pointAt(this.route, progress);
      marker.g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      marker.g.classList.toggle('is-gone', done);
      if (!done && (!leader || progress > leader.progress)) leader = marker;
    });
    this.markers.forEach(marker => marker.g.classList.toggle('is-leader', marker === leader));
    if (leader) leader.g.parentNode.appendChild(leader.g);
    if (this.lap) {
      this.lap.textContent = leader
        ? `Lap ${Math.min(Math.floor(leader.progress) + 1, this.race.laps)} of ${this.race.laps}`
        : 'Finish';
    }
  }

  destroy() {
    this.stop();
    if (this.observer) this.observer.disconnect();
  }
}

export default ReplayTeaser;
