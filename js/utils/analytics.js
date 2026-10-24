/**
 * Analytics
 *
 * Reports the site's key clicks to Google Analytics 4, once each, from one
 * listener on the document, and the race replay opening, which RaceReplay
 * announces on the event bus. gtag is defined by each page's head snippet;
 * where it is missing (blocked, or a test) nothing is sent.
 *
 * Nothing that identifies a rider is sent: a followed replay says that a
 * rider was followed, never which.
 */

import eventBus from '../core/eventBus.js';

// The section a click came from, or the header around it.
function placeOf(element) {
  const section = element.closest('section[id]');
  if (section) return section.id;
  return element.closest('header') ? 'header' : 'page';
}

// The clicks worth counting, first match wins: what was clicked, and the event
// it is reported as.
const CLICKS = [
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

export function send(name, params) {
  if (typeof window.gtag === 'function') window.gtag('event', name, params);
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
    this.unsubscribe = null;
  }

  static create() {
    return new Analytics().init();
  }

  init() {
    document.addEventListener('click', this.onClick);
    this.unsubscribe = eventBus.on('replay:opened', ({ race, source, following }) => {
      send('replay_open', { race, source, following: following ? 'yes' : 'no' });
    });
    return this;
  }

  onClick(event) {
    const found = eventFor(event.target);
    if (found) send(...found);
  }

  destroy() {
    document.removeEventListener('click', this.onClick);
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = null;
  }
}

export default Analytics;
