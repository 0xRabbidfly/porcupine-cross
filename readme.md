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

### Phase 3: In Progress
- Implemented section visibility functionality with IntersectionObserver
- Created tests for section visibility with good coverage
- Fixed site display issue where content was not visible

## Test Coverage
- Overall: 25.23% statements, 19.58% branches, 27.82% functions
- CountdownTimer: 100% coverage
- Section Visibility: Well covered in main.js

## Next Steps
1. Continue refactoring remaining components to achieve full test coverage
2. Implement additional tests for AudioManager and InteractiveMap
3. Improve test coverage for domUtils and eventBus
4. Implement E2E tests
5. Setup CI/CD integration

## Local Development
- Run tests: `npm test`
- Run tests with coverage: `npm run test:coverage`
- Start dev server: `npx http-server -p 8000`