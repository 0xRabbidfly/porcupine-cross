# Porcupine Cross - Development Rules & Best Practices

This file captures the established patterns, conventions, and best practices for the Porcupine Cross project. Follow these guidelines to maintain consistency and quality.

## 🏗️ Project Architecture

### Modular Structure

- **JavaScript**: Use ES6 modules with clear separation of concerns
  - `/js/components/` - Reusable UI components (AudioManager, CountdownTimer, etc.)
  - `/js/core/` - Core system functionality (eventBus, animationSystem, etc.)
  - `/js/utils/` - Pure utility functions (domUtils, audioUtils, etc.)
- **CSS**: Component-based organization with imports
  - `/css/components/` - Component-specific styles
  - `/css/theme.css` - CSS custom properties and design tokens
  - Use `@import` statements for modular CSS loading

### Event-Driven Architecture

- Use the centralized `eventBus` for component communication
- Emit semantic events (e.g., `audioManager:initialized`, `section:visible`)
- Always include relevant data with events
- Subscribe/unsubscribe properly to prevent memory leaks

## 🎯 JavaScript Best Practices

### ES6+ Standards

```javascript
// ✅ Good - ES6 modules with named exports
export function getElement(id, errorMsg = null) { ... }
export default eventBus;

// ✅ Good - Class-based components with proper JSDoc
/**
 * Audio Manager Component
 * @param {Object} options - Configuration options
 */
class AudioManager {
  constructor(options = {}) { ... }
}
```

### Error Handling & Safety

```javascript
// ✅ Always check for element existence
const element = getElement('myId');
if (!element) return;

// ✅ Use try-catch for risky operations
try {
  soundElement.currentTime = 0;
  return soundElement.play().catch(() => null);
} catch {
  return null;
}

// ✅ Graceful degradation for browser APIs
if (window.navigator && window.navigator.vibrate) {
  window.navigator.vibrate([10, 30, 10]);
}
```

### Component Patterns

- Use constructor options with sensible defaults
- Implement proper initialization lifecycle
- Emit events for state changes
- Provide public APIs for external control
- Always clean up event listeners and intervals

### DOM Manipulation

```javascript
// ✅ Use utility functions for consistency
import { getElement, getElements, addEventListeners } from './utils/domUtils.js';

// ✅ Batch DOM operations when possible
const elements = getElements('.cta-button');
addEventListeners(elements, 'click', handleClick);
```

## 🎨 CSS Architecture

### CSS Custom Properties

```css
/* ✅ Define design tokens in :root */
:root {
  --color-primary: #e73e3a;
  --color-accent: #ffc107;
  --header-height-desktop: 90px;
  --base-font-size: 16px;
}

/* ✅ Always provide fallbacks */
body {
  color: var(--color-dark, #333);
  font-family: var(--font-main, Arial, sans-serif);
}
```

### Component-Based CSS

- One CSS file per component
- Use semantic class names (BEM-like preferred)
- Import component styles in `css/components/index.css`
- Keep component styles self-contained

### Responsive Design

```css
/* ✅ Mobile-first approach with max-width breakpoints */
@media (max-width: 768px) {
  .component { ... }
}

/* ✅ Use consistent breakpoints */
/* Mobile: up to 768px */
/* Tablet: 769px to 1024px */
/* Desktop: 1025px+ */
```

### Animation Standards

```css
/* ✅ Prefer CSS transitions over JavaScript animations */
.section {
  opacity: 0;
  transform: translateY(50px);
  transition:
    opacity 0.6s ease-out,
    transform 0.7s ease-out;
}

.section.visible {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

## 🧪 Testing Standards

### Test Organization

```javascript
// ✅ Use describe blocks for logical grouping
describe('AudioManager', () => {
  describe('constructor', () => {
    test('should initialize with default options', () => { ... });
  });

  describe('playSound', () => {
    test('should play sound when enabled', () => { ... });
  });
});
```

### Mocking Strategy

```javascript
// ✅ Mock external dependencies
jest.mock('../../js/core/eventBus.js', () => ({
  emit: jest.fn(),
}));

// ✅ Create comprehensive mocks for DOM elements
const mockElement = {
  addEventListener: jest.fn(),
  classList: { add: jest.fn(), remove: jest.fn() },
  play: jest.fn().mockResolvedValue(undefined),
};
```

### Test Coverage

- Aim for >80% code coverage
- Test all public methods and edge cases
- Mock console methods to avoid test output noise
- Test both success and failure scenarios

## 🌐 HTML & Accessibility

### Semantic HTML

```html
<!-- ✅ Proper semantic structure -->
<main id="main" role="main">
  <section id="home" class="hero section-grid">
    <h1>Prologue</h1>
  </section>
</main>

<!-- ✅ Accessibility attributes -->
<button aria-label="Open Menu" aria-expanded="false" aria-controls="main-nav">
  <span class="hamburger"></span>
</button>
```

### Performance Optimization

```html
<!-- ✅ Optimize image loading -->
<img src="images/logo.webp" alt="Logo" loading="lazy" />

<!-- ✅ Preconnect to external fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- ✅ Use preload="none" for audio that may not play -->
<audio id="click-sound" preload="none"></audio>
```

## 🔧 Build & Development

### Package.json Scripts

- `npm run dev` - Development server with hot reload
- `npm test` - Run Jest tests
- `npm run test:watch` - Watch mode for TDD
- `npm run test:coverage` - Generate coverage reports
- `npm run lint` - ESLint check
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Prettier formatting

### Code Quality Tools

- **ESLint**: Enforce code standards with custom config
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality gates
- **lint-staged**: Run linters only on staged files

### Git Workflow

```json
// ✅ Pre-commit quality checks
"lint-staged": {
  "*.js": ["eslint --fix", "prettier --write"],
  "*.{json,css,md}": ["prettier --write"]
}
```

## 📱 Mobile & Progressive Enhancement

### Mobile-First Development

- Design for mobile screens first
- Use progressive enhancement for desktop features
- Test touch interactions and gesture support
- Implement proper viewport meta tags

### Audio Handling

```javascript
// ✅ Handle mobile audio restrictions
primeAudio() {
  if (!this.audioPrimed && this.elements.clickSound) {
    this.elements.clickSound.play()
      .then(() => {
        this.elements.clickSound.pause();
        this.audioPrimed = true;
      })
      .catch(() => {
        // Silent failure for browsers that block audio
      });
  }
}
```

## 🔄 State Management

### Component State

- Use class properties for internal state
- Emit events when state changes
- Provide getters for external state access
- Initialize state in constructor with defaults

### Event Bus Usage

```javascript
// ✅ Semantic event naming
eventBus.emit('audioManager:toggled', { enabled: this.enabled });
eventBus.emit('section:visible', { id: entry.target.id, element: entry.target });

// ✅ Always clean up subscriptions
const unsubscribe = eventBus.on('event', callback);
// Later...
unsubscribe();
```

## 🚀 Performance Guidelines

### Lazy Loading

- Use `loading="lazy"` for below-fold images
- Implement intersection observers for animations
- Load audio files with `preload="none"` when appropriate

### Animation Performance

- Prefer CSS transforms over layout-triggering properties
- Use `will-change` sparingly and remove after animations
- Implement requestAnimationFrame for JavaScript animations

### Bundle Optimization

- Use ES6 modules for tree shaking
- Keep components small and focused
- Minimize third-party dependencies

## 🎛️ Configuration Management

### Environment Setup

- Use `.env` files for environment-specific configuration
- Document all required environment variables
- Provide sensible defaults in code

### Feature Flags

```javascript
// ✅ Use configuration objects for feature toggles
const audioManager = new AudioManager({
  enabled: false,
  playbackProbability: 0.4,
  playThrottleMs: 100,
});
```

## 📚 Documentation Standards

### Code Comments

```javascript
/**
 * Component description
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Initial enabled state
 * @returns {Promise|null} Description of return value
 */
```

### README Requirements

- Installation and setup instructions
- Development workflow
- Testing procedures
- Deployment process
- Architecture overview

## 🔒 Security Considerations

### Input Validation

- Validate all user inputs
- Sanitize data before DOM insertion
- Use proper CSP headers in production

### External Resources

- Use `rel="noopener"` for external links
- Validate third-party script integrity
- Monitor for security vulnerabilities in dependencies

---

_Last updated: 2024 - Keep this document current with project evolution_
