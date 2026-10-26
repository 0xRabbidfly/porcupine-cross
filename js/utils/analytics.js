/**
 * Analytics
 *
 * Reports engagement to Google Analytics 4. The site's key clicks are counted
 * once each, from one listener on the document. The race replay reports what
 * people do in it on the event bus (`replay:opened`, `analytics:track`), and
 * the photos page's inline gallery, which cannot import the bus, dispatches
 * `analytics:track` on the document. gtag is defined by each page's head
 * snippet; where it is missing (blocked, or a test) nothing is sent.
 *
 * Nothing that identifies a rider is sent: no bib number and no name. A
 * followed replay says that a rider was followed, never which.
 */

import eventBus from '../core/eventBus.js';

// Named parts of a page, before falling back to its section or header.
const PLACES = [
  ['.gallery-races', 'race_deck'],
  ['.race-results', 'results_board'],
  ['.rider-panel', 'rider_panel'],
  ['.results-popup', 'results_popup'],
];

/** Where on the page an element is: a named part, its section, or the header. */
export function placeOf(element) {
  for (const [selector, place] of PLACES) {
    if (element.closest(selector)) return place;
  }
  const section = element.closest('section[id]');
  if (section) return section.id;
  return element.closest('header') ? 'header' : 'page';
}

// The clicks worth counting, first match wins: what was clicked, and the event
// it is reported as. A link into the replay is styled like the register
// button, so it is matched first.
const CLICKS = [
  [
    'a[href*="replay="]',
    el => ['button_click', { button_name: 'watch_replay', button_location: placeOf(el) }],
  ],
  [
    '.hero-register-button, .register-button, .register-icon-link',
    el => ['button_click', { button_name: 'register', button_location: placeOf(el) }],
  ],
  [
    '.results-button',
    el => ['button_click', { button_name: 'results', button_location: placeOf(el) }],
  ],
  [
    '.audio-play-btn',
    el => ['button_click', { button_name: 'audio_play', button_location: placeOf(el) }],
  ],
  [
    '.surface-logo',
    el => ['button_click', { button_name: 'spade_logo', button_location: placeOf(el) }],
  ],
  [
    '.photos-credit a',
    el => ['link_click', { link_name: 'photographer_site', link_location: placeOf(el) }],
  ],
  [
    'a[href*="instagram.com"]',
    el => ['link_click', { link_name: 'instagram_follow', link_location: placeOf(el) }],
  ],
  [
    'a[href*="facebook.com"]',
    el => ['link_click', { link_name: 'facebook_follow', link_location: placeOf(el) }],
  ],
  ['a[href^="mailto:"]', el => ['link_click', { link_name: 'email', link_location: placeOf(el) }]],
  [
    'a[href*="maps.google."]',
    el => ['link_click', { link_name: 'map', link_location: placeOf(el) }],
  ],
];

/** Sends one event, leaving out the parameters that have no value. */
export function send(name, params = {}) {
  if (typeof window.gtag !== 'function') return;
  const clean = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') clean[key] = value;
  });
  window.gtag('event', name, clean);
}

/** The event a click reports, or null when it is not one worth counting. */
export function eventFor(target) {
  if (!target || typeof target.closest !== 'function') return null;
  for (const [selector, describe] of CLICKS) {
    const element = target.closest(selector);
    if (element) return describe(element);
  }
  return null;
}

class Analytics {
  constructor() {
    this.onClick = this.onClick.bind(this);
    this.onTrack = this.onTrack.bind(this);
    this.unsubscribers = [];
  }

  static create() {
    return new Analytics().init();
  }

  init() {
    document.addEventListener('click', this.onClick);
    document.addEventListener('analytics:track', this.onTrack);
    this.unsubscribers = [
      eventBus.on('replay:opened', ({ race, source, opener, following }) => {
        send('replay_open', {
          race,
          source: opener ? placeOf(opener) : source,
          following: following ? 'yes' : 'no',
        });
      }),
      eventBus.on('analytics:track', ({ name, params }) => send(name, params)),
    ];
    return this;
  }

  onClick(event) {
    const found = eventFor(event.target);
    if (found) send(...found);
  }

  onTrack(event) {
    const { name, params } = event.detail || {};
    if (name) send(name, params);
  }

  destroy() {
    document.removeEventListener('click', this.onClick);
    document.removeEventListener('analytics:track', this.onTrack);
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }
}

export default Analytics;
