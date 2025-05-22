# Porcupine-Cross Cyclocross Website

A testable, modular implementation of the Prologue Cyclocross Race website.

## Original Project Plan

### Phase 1: Setup Testing Infrastructure
- Install Jest and configure for ES6 support
- Create test directory structure
- Set up basic tests and assertions
- Establish testing environment for DOM testing

### Phase 2: Code Modularization
- Break up monolithic script.js into smaller components
- Extract core functionality into separate modules
- Create utilities for DOM manipulation and event handling
- Implement event bus for component communication
- Update HTML to use modular JavaScript

### Phase 3: Refactor Components
- Refactor each component to be testable
- Implement dependency injection
- Decouple UI manipulation from business logic
- Make core functionality pure functions where possible

### Phase 4: Test Implementation
- Implement unit tests for all components
- Add integration tests for component interactions
- Create component tests for UI functionality
- Develop E2E tests for critical user flows

### Phase 5: Coverage Optimization
- Analyze test coverage with Jest
- Identify and address coverage gaps
- Refactor code to improve testability
- Aim for 100% code coverage

### Phase 5.5: UI Refactoring & CSS Best Practices
- Implement proper CSS architecture for UI components
- Refactor mobile menu using CSS best practices
- Enhance animation framework with unified API
- Fix event handling and propagation issues
- Replace timeout-based animations with CSS transitions
- Implement proper state management for UI components

### Phase 6: CI/CD Integration
- Set up GitHub Actions for automated testing
- Configure pre-commit hooks for test verification
- Implement automated deployments
- Create code quality checks

### Phase 7: Performance Testing
- Add performance tests for critical paths
- Implement load testing for important components
- Create benchmarks for baseline performance
- Add monitoring and metrics

## Project Progress

### Phase 1: Setup Testing Infrastructure ✅
- Jest testing framework set up
- Directory structure created
- CountdownTimer component extracted and tested with 100% coverage

### Phase 2: Code Modularization ✅
- Monolithic script broken into component modules:
  - CountdownTimer
  - AudioManager
  - InteractiveMap
- Core utilities developed:
  - eventBus for component communication
  - domUtils for DOM manipulation
- Main app controller created to orchestrate components

### Phase 3: Component Refactoring ✅
- Implemented section visibility with IntersectionObserver
- Added mud splat animations with tests
- Completed sound toggle button functionality
- Made components testable with proper dependency injection
- Decoupled UI manipulation from business logic

### Phase 4: Test Implementation ✅
- Implemented comprehensive tests for AudioManager with 100% coverage
- All component methods are fully tested with edge cases
- Created mocks for DOM elements and browser APIs
- Event listeners and event bus communication are tested

### Phase 5: Coverage Optimization (In Progress)
- Achieved 100% statement and function coverage for eventBus utility
- Improved domUtils utility test coverage from 20% to 47%
- Fixed failing tests and implemented robust mocks
- Reached an overall coverage improvement from 39% to 44%
- Identified and implemented critical fixes for mobile menu functionality
- Created animation bridge for ES module and non-module environments

### Phase 5.5: UI Refactoring & CSS Best Practices (Planned)
- Identified CSS best practices violations in current implementation
- Documented technical debt from expedient mobile menu/animation fixes
- Planned comprehensive refactoring of UI components architecture
- Created scope for animation framework enhancement

## Details: Phase 5.5 UI Refactoring & CSS Best Practices

After addressing critical mobile menu and animation issues, we've identified the need for a dedicated refactoring phase to implement proper CSS/JS architecture:

### Mobile Menu Refactoring:
- Separate state management (JS) from presentation (CSS)
- Replace direct style manipulation with CSS class toggles
- Implement proper CSS transitions using transform/opacity instead of display/visibility
- Add transition event listeners to replace setTimeout-based animation locks
- Fix event propagation issues with proper event delegation

### CSS Architecture Improvements:
- Create a proper state machine for UI components with clear state transitions
- Use transform-based animations for better performance
- Implement the checkbox hack for simple UI toggles where appropriate
- Establish a documented z-index scale to prevent stacking context issues
- Use pointer-events strategically to manage interaction during animations

### Animation Framework Enhancement:
- Refactor animation bridge to follow singleton pattern
- Create unified API for animations that works in both module and non-module contexts
- Implement animation queue to prevent animation conflicts
- Add feature detection for progressive enhancement

This phase will fix the technical debt introduced by expedient hotfixes and establish a solid foundation for future UI components.

## Current Test Coverage

| Component/Module   | % Statements | % Branch | % Functions | % Lines |
|-------------------|--------------|----------|-------------|---------|
| Overall           | 43.94%       | 33.73%   | 45.31%      | 44.35%  |
| AudioManager      | 94.73%       | 97.56%   | 78.57%      | 94.73%  |
| CountdownTimer    | 100%         | 68.96%   | 100%        | 100%    |
| interactiveMap    | 22.68%       | 15.21%   | 15.78%      | 25%     |
| eventBus          | 100%         | 90%      | 100%        | 100%    |
| animationUtils    | 100%         | 71.42%   | 100%        | 100%    |
| domUtils          | 47.05%       | 51.42%   | 63.63%      | 47.05%  |
| main.js           | 59.7%        | 22.95%   | 65%         | 60.15%  |

## Next Steps (Phase 5)
1. Implement tests for InteractiveMap component
2. Further improve domUtils coverage
3. Add integration tests for component interactions
4. Create more complex test cases for main.js

## Local Development
- Run tests: `npm test`
- Run tests with coverage: `npm run test:coverage`
- Start dev server: `npx http-server -p 8000`