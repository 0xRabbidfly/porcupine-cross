/**
 * Results Popup Component
 *
 * After race day, a visitor landing on the home page is dealt a card: the
 * results are in, with the way to the race replays, the results and their
 * photos. It shows once per browser, a moment after the page settles, however
 * the visitor arrived. Before `data-show-after` it stays away, and a new
 * event's date shows it again.
 */

const SEEN_KEY = 'pc-results-popup-seen';
const DELAY_MS = 1200;

class ResultsPopup {
  /**
   * @param {HTMLElement} element - The hidden popup, with `data-show-after`
   * @param {Object} options - Configuration options
   * @param {Function} [options.getNow] - Returns the current timestamp
   */
  constructor(element, options = {}) {
    this.element = element;
    this.showAfter = new Date(element.dataset.showAfter).getTime();
    this.getNow = options.getNow || (() => Date.now());
    this.timer = null;
    this.onKey = this.onKey.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  /**
   * Arm the popup on the page that has one
   * @param {string} selector - Popup selector
   * @returns {ResultsPopup|null} Instance, or null when the page has none
   */
  static create(selector = '.results-popup') {
    const element = document.querySelector(selector);
    return element ? new ResultsPopup(element).start() : null;
  }

  start() {
    if (this.shouldShow()) {
      this.timer = setTimeout(() => this.open(), DELAY_MS);
    }
    return this;
  }

  shouldShow() {
    if (Number.isNaN(this.showAfter) || this.getNow() < this.showAfter) return false;
    try {
      // The key holds the date it was shown for: a new event's date shows it again.
      return window.localStorage.getItem(SEEN_KEY) !== this.element.dataset.showAfter;
    } catch {
      // No storage (a private window): show it, at most once per visit.
      return true;
    }
  }

  open() {
    this.timer = null;
    this.element.hidden = false;
    document.addEventListener('keydown', this.onKey);
    this.element.addEventListener('click', this.onClick);
    try {
      window.localStorage.setItem(SEEN_KEY, this.element.dataset.showAfter);
    } catch {
      // Nothing to remember it in; it will not show again this visit anyway.
    }
    const first = this.element.querySelector('.results-popup-primary');
    if (first) first.focus();
  }

  close() {
    this.element.hidden = true;
    document.removeEventListener('keydown', this.onKey);
    this.element.removeEventListener('click', this.onClick);
  }

  onKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  // The backdrop, the x and "Maybe later" close it; so does any of its links,
  // so the page is clear where the link lands.
  onClick(event) {
    if (event.target === this.element || event.target.closest('[data-popup-close], a')) {
      this.close();
    }
  }

  destroy() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.close();
  }
}

export default ResultsPopup;
