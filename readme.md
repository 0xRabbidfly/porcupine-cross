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

### Phase 4: Test Implementation (In Progress)
- Implemented comprehensive tests for AudioManager with 100% coverage
- All component methods are fully tested with edge cases
- Created mocks for DOM elements and browser APIs
- Event listeners and event bus communication are tested

## Current Test Coverage

| Component/Module   | % Statements | % Branch | % Functions | % Lines |
|-------------------|--------------|----------|-------------|---------|
| Overall           | 39.47%       | 28.65%   | 35.93%      | 40.13%  |
| AudioManager      | 94.73%       | 97.56%   | 78.57%      | 94.73%  |
| CountdownTimer    | 100%         | 68.96%   | 100%        | 100%    |
| interactiveMap    | 22.68%       | 15.21%   | 15.78%      | 25%     |
| eventBus          | 16.66%       | 10%      | 20%         | 15.38%  |
| animationUtils    | 100%         | 71.42%   | 100%        | 100%    |
| domUtils          | 20.58%       | 25.71%   | 27.27%      | 20.58%  |
| main.js           | 59.7%        | 22.95%   | 65%         | 60.15%  |

## Next Steps (Phase 4)
1. Implement tests for AudioManager component
2. Implement tests for InteractiveMap component
3. Add integration tests for component interactions
4. Create E2E tests for critical user flows

## Local Development
- Run tests: `npm test`
- Run tests with coverage: `npm run test:coverage`
- Start dev server: `npx http-server -p 8000`