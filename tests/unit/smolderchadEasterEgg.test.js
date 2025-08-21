/**
 * SMOLDERCHAD Easter Egg Tests
 */

import SmolderchadEasterEgg from '../../js/components/smolderchadEasterEgg.js';

describe('SmolderchadEasterEgg', () => {
  let easterEgg;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = '';

    // Create easter egg instance
    easterEgg = new SmolderchadEasterEgg();
  });

  afterEach(() => {
    // Clean up
    if (easterEgg) {
      easterEgg.destroy();
    }
    document.body.innerHTML = '';
  });

  test('should initialize with correct properties', () => {
    expect(easterEgg.triggerSequence).toBe('wtf');
    expect(easterEgg.currentSequence).toBe('');
    expect(easterEgg.isActive).toBe(false);
    expect(easterEgg.element).toBeDefined();
  });

  test('should create DOM elements', () => {
    const container = document.querySelector('.smolderchad-easter-egg');
    expect(container).toBeDefined();

    const imageContainer = container.querySelector('.image-container');
    expect(imageContainer).toBeDefined();

    const image = imageContainer.querySelector('img');
    expect(image).toBeDefined();
    expect(image.src).toContain('SMOLDERCHAD.jpeg');
    expect(image.alt).toBe('SMOLDERCHAD');

    const creditPanel = imageContainer.querySelector('.credit-panel');
    expect(creditPanel).toBeDefined();

    const credit = creditPanel.querySelector('.credit');
    expect(credit).toBeDefined();
    expect(credit.textContent).toBe('Designed and Built by Nuno Borges');
  });

  test('should trigger easter egg when typing "wtf"', () => {
    // Type the trigger sequence
    const keys = ['w', 't', 'f'];
    keys.forEach(key => {
      const event = new KeyboardEvent('keydown', { key });
      document.dispatchEvent(event);
    });

    // Check if easter egg is active
    expect(easterEgg.isActive).toBe(true);
    expect(easterEgg.element.style.display).toBe('block');
  });

  test('should trigger easter egg with spade logo click', () => {
    // Create spade logo element
    const spadeLogo = document.createElement('div');
    spadeLogo.className = 'surface-logo';
    document.body.appendChild(spadeLogo);

    // Manually trigger the setup since we're testing the event attachment
    easterEgg.attachSpadeLogoEvents(spadeLogo);

    // Simulate click on spade logo
    spadeLogo.click();

    // Check if easter egg is active
    expect(easterEgg.isActive).toBe(true);
    expect(easterEgg.element.style.display).toBe('block');

    // Clean up
    document.body.removeChild(spadeLogo);
  });

  test('should not trigger easter egg with wrong sequence', () => {
    // Type wrong sequence
    const keys = ['h', 'e', 'l', 'l', 'o'];
    keys.forEach(key => {
      const event = new KeyboardEvent('keydown', { key });
      document.dispatchEvent(event);
    });

    // Check if easter egg is not active
    expect(easterEgg.isActive).toBe(false);
    expect(easterEgg.element.style.display).toBe('none');
  });

  test('should reset sequence after triggering', () => {
    // Type the trigger sequence
    const keys = ['w', 't', 'f'];
    keys.forEach(key => {
      const event = new KeyboardEvent('keydown', { key });
      document.dispatchEvent(event);
    });

    // Check if sequence is reset
    expect(easterEgg.currentSequence).toBe('');
  });

  test('should handle sequence overflow correctly', () => {
    // Type more than the trigger length
    const keys = ['h', 'e', 'l', 'l', 'o', 'w', 'o', 'r', 'l', 'd', 'w', 't', 'f'];
    keys.forEach(key => {
      const event = new KeyboardEvent('keydown', { key });
      document.dispatchEvent(event);
    });

    // Should still trigger with the last 3 characters
    expect(easterEgg.isActive).toBe(true);
  });

  test('should destroy properly', () => {
    easterEgg.destroy();

    // Check if element is removed
    const container = document.querySelector('.smolderchad-easter-egg');
    expect(container).toBeNull();
  });
});
