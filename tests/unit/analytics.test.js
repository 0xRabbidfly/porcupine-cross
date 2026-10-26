/**
 * Analytics Unit Tests
 */

import Analytics, { eventFor } from '../../js/utils/analytics.js';
import eventBus from '../../js/core/eventBus.js';

describe('Analytics', () => {
  let analytics;

  beforeEach(() => {
    window.gtag = jest.fn();
    document.body.innerHTML = `
      <header>
        <img class="surface-logo" alt="">
        <button class="audio-play-btn"><span class="audio-icon"></span></button>
      </header>
      <section id="home">
        <a class="hero-register-button" href="https://upliftercycling.com/"><span>Register</span></a>
      </section>
      <section id="results">
        <a class="results-button" href="photos.html">Results</a>
      </section>
      <section id="contact">
        <a href="mailto:someone@example.com">Email</a>
        <a href="https://maps.google.com/?q=Elgin+Park">Map</a>
        <a href="https://www.instagram.com/prologuecx/">Instagram</a>
        <a href="https://www.facebook.com/profile.php?id=1">Facebook</a>
        <a href="#schedule">Schedule</a>
      </section>`;
    analytics = Analytics.create();
  });

  afterEach(() => {
    analytics.destroy();
    delete window.gtag;
  });

  const click = selector => document.querySelector(selector).click();

  test('a register click is reported once, with where it came from', () => {
    document.querySelector('.hero-register-button span').click();

    expect(window.gtag).toHaveBeenCalledTimes(1);
    expect(window.gtag).toHaveBeenCalledWith('event', 'button_click', {
      button_name: 'register',
      button_location: 'home',
    });
  });

  test('each tracked control reports its own event', () => {
    expect(eventFor(document.querySelector('.results-button'))).toEqual([
      'button_click',
      { button_name: 'results', button_location: 'results' },
    ]);
    expect(eventFor(document.querySelector('.audio-icon'))).toEqual([
      'button_click',
      { button_name: 'audio_play', button_location: 'header' },
    ]);
    expect(eventFor(document.querySelector('a[href^="mailto:"]'))[1].link_name).toBe('email');
    expect(eventFor(document.querySelector('a[href*="maps"]'))[1].link_name).toBe('map');
    expect(eventFor(document.querySelector('a[href*="instagram"]'))[1]).toEqual({
      link_name: 'instagram_follow',
      link_location: 'contact',
    });
    expect(eventFor(document.querySelector('a[href*="facebook"]'))[1].link_name).toBe(
      'facebook_follow'
    );
  });

  test('a click on anything else sends nothing', () => {
    click('a[href="#schedule"]');
    document.body.click();

    expect(window.gtag).not.toHaveBeenCalled();
  });

  test('a replay opening is reported without the rider', () => {
    eventBus.emit('replay:opened', { race: 'Cat A', source: 'link', following: true });

    expect(window.gtag).toHaveBeenCalledWith('event', 'replay_open', {
      race: 'Cat A',
      source: 'link',
      following: 'yes',
    });
  });

  test('a link into the replay counts as watching, not registering', () => {
    document
      .querySelector('#home')
      .insertAdjacentHTML(
        'beforeend',
        '<a class="hero-register-button" href="photos.html?replay=Cat%20A">Watch the races</a>'
      );
    expect(eventFor(document.querySelector('a[href*="replay="]'))).toEqual([
      'button_click',
      { button_name: 'watch_replay', button_location: 'home' },
    ]);
  });

  test("a click through to a photographer's site is counted", () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<p class="photos-credit">Photographed by <a href="https://example.com/">Jeff</a></p>'
    );
    expect(eventFor(document.querySelector('.photos-credit a'))).toEqual([
      'link_click',
      { link_name: 'photographer_site', link_location: 'page' },
    ]);
  });

  test("a replay opened from a button reports the part of the page it's in", () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div class="gallery-races"><button data-replay="Cat C">Cat C</button></div>'
    );
    eventBus.emit('replay:opened', {
      race: 'Cat C',
      source: 'button',
      opener: document.querySelector('.gallery-races button'),
      following: false,
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'replay_open', {
      race: 'Cat C',
      source: 'race_deck',
      following: 'no',
    });
  });

  test('engagement from the bus and from the page is sent on, without empty values', () => {
    eventBus.emit('analytics:track', {
      name: 'replay_speed',
      params: { race: 'Cat A', speed: 120, lap: undefined },
    });
    document.dispatchEvent(
      new CustomEvent('analytics:track', {
        detail: { name: 'photo_open', params: { race: 'Men B', method: 'grid', photographer: '' } },
      })
    );

    expect(window.gtag.mock.calls).toEqual([
      ['event', 'replay_speed', { race: 'Cat A', speed: 120 }],
      ['event', 'photo_open', { race: 'Men B', method: 'grid' }],
    ]);
  });

  test('without gtag, clicks are ignored quietly', () => {
    delete window.gtag;

    expect(() => click('.results-button')).not.toThrow();
  });

  test('destroy stops reporting clicks, replay opens and engagement', () => {
    analytics.destroy();
    click('.results-button');
    eventBus.emit('replay:opened', { race: 'Cat A', source: 'button', following: false });
    eventBus.emit('analytics:track', { name: 'replay_play', params: {} });
    document.dispatchEvent(new CustomEvent('analytics:track', { detail: { name: 'photo_open' } }));

    expect(window.gtag).not.toHaveBeenCalled();
  });
});
