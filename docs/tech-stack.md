# Porcupine-Cross Technical Stack

This document outlines the technical stack, architectural patterns, and best practices implemented in the Porcupine-Cross Cyclocross website project.

## Core Technologies

### Frontend Stack
- **Vanilla JavaScript (ES6+)** - Core language with modern features
- **CSS3** - Advanced styling with transitions and animations
- **HTML5** - Semantic markup

### Module System
- **ES Modules** - Native JavaScript modules with import/export
- **Module Bridge Pattern** - Compatibility layer for both module and non-module environments

## Architecture

### Component-Based Architecture
The application follows a component-based architecture where each UI element is encapsulated in its own component with:
- Isolated state management
- Clear public API
- Event-based communication

### Event Bus Pattern
- Centralized event management via `eventBus.js`
- Publish-subscribe pattern for component communication
- Decoupled components that interact via events

### Singleton Pattern
Used for core services like:
- `AnimationSystem` - Manages all animations
- `AudioManager` - Handles sound effects
- `App` - Main application controller

### State Machine Pattern
UI components implement state machines for:
- Clear state transitions
- Preventing invalid state changes
- Tracking animation states

## Testing Framework

### Jest
- Main test runner and assertion library
- Unit tests for all components and utilities
- Module mocking capabilities

### Testing Library
- `@testing-library/dom` - DOM testing utilities
- `@testing-library/jest-dom` - Custom DOM matchers

### Test Coverage
- Statement, branch, function, and line coverage metrics
- Component-specific coverage goals

## CSS Architecture

### Component-Based CSS
- Modular CSS files for each component
- Scoped class names to prevent conflicts
- Clear separation between components

### CSS Variables
- Custom properties for theming
- Animation and transition timing variables
- Responsive breakpoint variables

### Animation System
- CSS transitions for smooth animations
- Transform and opacity for performance
- Hardware-accelerated animations where appropriate
- Unified animation API

## JavaScript Best Practices

### Separation of Concerns
- CSS for presentation
- JavaScript for behavior
- HTML for structure

### Event Delegation
- Efficient event handling
- Improved performance for dynamic elements

### Progressive Enhancement
- Core functionality works without JavaScript
- Enhanced experiences with JavaScript
- Feature detection for API support

### Performance Optimization
- Minimal DOM manipulation
- Throttled event handlers
- CSS transitions instead of JavaScript animations
- Efficient animation batching and queuing

## Code Organization

### Directory Structure
- `/js/components/` - UI components (CountdownTimer, AudioManager, etc.)
- `/js/core/` - Core services (eventBus, AnimationSystem)
- `/js/utils/` - Utility functions (domUtils)
- `/css/components/` - Component-specific styles
- `/tests/unit/` - Unit tests

### Module Patterns
- Each component is a self-contained module
- Clear imports/exports
- Minimal global namespace pollution

## Development Workflow

### Testing First Development
- Jest for automated testing
- Test-driven development for core components
- High test coverage for critical code paths

### Code Review Process
- Thorough code reviews
- Check for best practices compliance
- Verify test coverage

## Accessibility Considerations

### ARIA Support
- Proper ARIA attributes for interactive elements
- Focus management for modals and menus
- Keyboard navigation support

### Progressive Enhancement
- Core functionality works without JavaScript
- Enhanced experiences with JavaScript
- Mobile-first responsive design

## Browser Compatibility

### Modern Browser Focus
- ES6+ features with graceful degradation
- Feature detection for advanced APIs
- CSS variables with fallbacks

### Mobile Support
- Touch-friendly interactions
- Responsive layout for all screen sizes
- Touch gesture support

## Future Roadmap

### Continuous Integration
- Automated testing pipeline
- Code quality checks
- Performance benchmarking

### Performance Monitoring
- Core Web Vitals tracking
- User experience metrics
- Load time optimization 