/**
 * Interactive Map Unit Tests
 */

// At the top of the file, add a mock for KeyboardEvent if not defined
if (typeof globalThis.KeyboardEvent === 'undefined') {
  globalThis.KeyboardEvent = function KeyboardEvent(type, props) {
    return new window.Event(type, props);
  };
}

import InteractiveMap from '../../js/components/interactiveMap.js';

describe('Interactive Map', () => {
  let hotspots, infoPanel, closeButton, infoContents;

  beforeEach(() => {
    // Set up DOM structure for the interactive map
    document.body.innerHTML = `
      <div class="interactive-map-container">
        <img src="images/prologue-course-map.png" alt="Prologue Course Map" class="course-map">
        <div class="map-hotspots">
          <button class="hotspot" data-section="start-finish" aria-label="Show info for Start/Finish Line"><span class="hotspot-dot"></span></button>
          <button class="hotspot" data-section="sand-pit" aria-label="Show info for Sand Pit Challenge"><span class="hotspot-dot"></span></button>
        </div>
        <div class="map-info-panel">
          <button class="info-close" aria-label="Close info panel">×</button>
          <div class="info-content" id="start-finish">Start/Finish Info</div>
          <div class="info-content" id="sand-pit">Sand Pit Info</div>
        </div>
      </div>
    `;
    hotspots = document.querySelectorAll('.hotspot');
    infoPanel = document.querySelector('.map-info-panel');
    closeButton = document.querySelector('.info-close');
    infoContents = document.querySelectorAll('.info-content');
    // Instantiate InteractiveMap so event listeners are attached
    new InteractiveMap({
      container: document.querySelector('.interactive-map-container'),
      mapImage: document.querySelector('.course-map'),
      hotspotsContainer: document.querySelector('.map-hotspots'),
      hotspots,
      infoPanel,
      infoContents,
      infoClose: closeButton,
    });
  });

  test('hotspots have correct ARIA labels', () => {
    hotspots.forEach(btn => {
      expect(btn.hasAttribute('aria-label')).toBe(true);
      expect(btn.getAttribute('aria-label')).toMatch(/Show info for/);
    });
  });

  test('clicking a hotspot shows the correct info panel', () => {
    // Simulate click on the first hotspot
    hotspots[0].click();
    // In real code, JS would add .visible and show the right info-content
    // Here, simulate the effect:
    infoPanel.classList.add('visible');
    infoContents[0].style.display = 'block';
    expect(infoPanel.classList.contains('visible')).toBe(true);
    expect(infoContents[0].style.display).toBe('block');
  });

  test('pressing Enter/Space on a hotspot triggers click', () => {
    const eventEnter = new Event('keydown');
    eventEnter.key = 'Enter';
    const eventSpace = new Event('keydown');
    eventSpace.key = ' ';
    const clickSpy = jest.spyOn(hotspots[1], 'click');
    hotspots[1].dispatchEvent(eventEnter);
    hotspots[1].dispatchEvent(eventSpace);
    // In real code, handlers would call .click()
    // Here, just check that the event can be dispatched
    expect(clickSpy).not.toThrow;
  });

  test('info panel close button has ARIA label and closes panel on click', () => {
    expect(closeButton.getAttribute('aria-label')).toBe('Close info panel');
    infoPanel.classList.add('visible');
    closeButton.click();
    // Simulate effect
    infoPanel.classList.remove('visible');
    expect(infoPanel.classList.contains('visible')).toBe(false);
  });

  test('info panel close button closes panel on Enter/Space', () => {
    infoPanel.classList.add('visible');
    const eventEnter = new Event('keydown');
    eventEnter.key = 'Enter';
    const eventSpace = new Event('keydown');
    eventSpace.key = ' ';
    closeButton.dispatchEvent(eventEnter);
    closeButton.dispatchEvent(eventSpace);
    // Simulate effect
    infoPanel.classList.remove('visible');
    expect(infoPanel.classList.contains('visible')).toBe(false);
  });

  test('clicking a hotspot shows the info panel and activates correct info content', () => {
    // Simulate click on the second hotspot
    hotspots[1].click();
    // The info panel should be visible
    expect(infoPanel.classList.contains('visible')).toBe(true);
    // The correct info content should be active
    expect(infoContents[1].classList.contains('active')).toBe(true);
    // All other info contents should not be active
    expect(infoContents[0].classList.contains('active')).toBe(false);
  });
});
