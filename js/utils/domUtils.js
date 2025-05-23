/* global HTMLElement, NodeList */
/**
 * DOM Utilities
 * Helper functions for common DOM operations
 */

/**
 * Get an element by id with error handling
 * @param {string} id - Element ID
 * @param {string} errorMsg - Optional custom error message
 * @returns {HTMLElement} The found element
 */
export function getElement(id, errorMsg = null) {
  const element = document.getElementById(id);
  if (!element && errorMsg) {
    console.error(errorMsg || `Element with id "${id}" not found.`);
  }
  return element;
}

/**
 * Get multiple elements by selector
 * @param {string} selector - CSS selector
 * @param {HTMLElement|Document} context - Parent element or document
 * @returns {Array<HTMLElement>} Array of found elements
 */
export function getElements(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/**
 * Create an element with specified attributes and content
 * @param {string} tagName - HTML tag name
 * @param {Object} attributes - Attributes to set on the element
 * @param {string|HTMLElement|Array<HTMLElement>} content - Content to append
 * @returns {HTMLElement} The created element
 */
export function createElement(tagName, attributes = {}, content = null) {
  const element = document.createElement(tagName);

  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else {
      element.setAttribute(key, value);
    }
  });

  // Add content
  if (content) {
    if (typeof content === 'string') {
      element.textContent = content;
    } else if (Array.isArray(content)) {
      content.forEach(child => {
        if (child instanceof HTMLElement) {
          element.appendChild(child);
        }
      });
    } else if (content instanceof HTMLElement) {
      element.appendChild(content);
    }
  }

  return element;
}

/**
 * Add event listeners to multiple elements
 * @param {Array<HTMLElement>|NodeList} elements - Elements to add listeners to
 * @param {string} eventType - Event type (e.g., 'click')
 * @param {Function} handler - Event handler function
 * @param {Object} options - Event listener options
 */
export function addEventListeners(elements, eventType, handler, options = {}) {
  if (elements) {
    const elementArray =
      Array.isArray(elements) || elements instanceof NodeList ? elements : [elements];

    elementArray.forEach(element => {
      element.addEventListener(eventType, handler, options);
    });
  }
}

/**
 * Toggle a class on an element
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class to toggle
 * @param {boolean} force - Force add or remove
 * @returns {boolean} Whether class is now present
 */
export function toggleClass(element, className, force) {
  if (element) {
    return element.classList.toggle(className, force);
  }
  return false;
}

/**
 * Add class to an element with automatic removal after delay
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class to add
 * @param {number} removeAfter - Time in ms to remove class
 */
export function addTemporaryClass(element, className, removeAfter) {
  if (element) {
    element.classList.add(className);
    setTimeout(() => {
      element.classList.remove(className);
    }, removeAfter);
  }
}
