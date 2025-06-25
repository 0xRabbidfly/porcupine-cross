# Prologue Cyclocross Website

A modern, high-performance website for the Prologue Cyclocross Race featuring clean architecture, comprehensive testing, and zero technical debt.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:8000` to view the website locally.

## 📊 Project Status

**✅ PRODUCTION READY**

- **990+ lines of deprecated code removed** (major cleanup completed)
- **101 tests passing** across 11 test suites (100% functionality preserved)
- **Zero technical debt** with aggressive cleanup policies
- **Enhanced front-end guidelines** with comprehensive best practices
- **Fully automated CI/CD pipeline** with GitHub Actions

## 🏗️ Architecture

### Component-Based Design

- **Modular ES6+ JavaScript** with clear separation of concerns
- **Event-driven communication** via centralized eventBus
- **Self-contained UI components** with isolated state management
- **Progressive enhancement** approach for accessibility

### Key Components

- **CountdownTimer** - Race day countdown with animated transitions
- **AudioManager** - Sound effects and audio playback control
- **InteractiveMap** - Course map with clickable hotspots and info panels
- **AnimationSystem** - Unified API for mud splatter effects and transitions
- **MobileMenu** - Responsive navigation with touch-friendly interactions

### File Structure

```
js/
├── components/        # UI components (CountdownTimer, AudioManager, etc.)
├── core/             # Core services (eventBus, AnimationSystem, App)
└── utils/            # Utility functions (domUtils, audioUtils)

css/
├── components/       # Component-specific styles
└── theme.css        # Global variables and theming

tests/
└── unit/            # Comprehensive unit tests (101 tests)
```

## 🧪 Testing & Quality

### Test Coverage

- **11 test suites** with 101 individual tests
- **High-quality mocks** for DOM elements and browser APIs
- **Event system testing** for component communication
- **Edge case coverage** for robust error handling

### Code Quality Standards

- **Zero-tolerance deprecated code policy** - immediate removal
- **File size limits**: CSS < 400 lines, JS < 500 lines
- **Function complexity**: < 10 cyclomatic complexity
- **Zero backwards compatibility** - clean breaks only

### Performance Targets

- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Bundle optimization** with tree shaking and dead code elimination
- **Hardware-accelerated animations** using CSS transforms
- **Aggressive asset optimization** with modern formats

## 🔧 Development Workflow

### Available Scripts

```bash
# Development
npm run dev              # Start development server with live reload
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report

# Code Quality
npm run lint             # ESLint code analysis
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Prettier code formatting
npm run quality          # Comprehensive quality check

# Deployment
npm run deploy           # Deploy to staging
npm run deploy:production # Deploy to production
```

### Pre-commit Hooks

- **Automated testing** on staged files
- **Code formatting** with Prettier
- **Linting** with ESLint
- **Quality gates** prevent low-quality commits

## 🚀 Deployment

### Automated CI/CD Pipeline

- **GitHub Actions** for continuous integration
- **Automated testing** on all pull requests
- **Production deployment** on master branch commits
- **FTP deployment** to Namecheap hosting

### Environment Setup

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment configuration.

## 🎨 Features

### Interactive Elements

- **Countdown Timer** - Animated race day countdown with date display
- **Interactive Course Map** - Clickable hotspots with detailed course information
- **Responsive Navigation** - Touch-friendly mobile menu with smooth animations
- **Audio Integration** - Race outline audio with accessible controls
- **Animation Effects** - Mud splatter animations on user interactions

### Design & UX

- **Card-themed Design** - Poker/playing card aesthetic with ace symbols
- **Red/White/Blue Color Scheme** - Professional racing brand colors
- **Mobile-first Responsive** - Optimized for all screen sizes
- **Accessibility Features** - ARIA labels, keyboard navigation, screen reader support

### Content Sections

- **Hero Section** - Race branding with countdown timer
- **About** - Detailed race information and experience description
- **Schedule** - Race times and categories
- **Course** - Interactive map with technical details
- **Register** - Registration information with animated call-to-action
- **Contact** - Email, location, and social media links

## 📋 Guidelines & Standards

The project follows comprehensive [Front-end Guidelines](.cursor/rules/front-end-guidelines.mdc) covering:

1. **Architecture & Code Organization**
2. **Code Quality & Maintenance**
3. **CSS Best Practices**
4. **JavaScript Best Practices**
5. **Performance Optimization**
6. **Security & Safety**
7. **Testing Requirements**
8. **Development Tooling & Workflow**
9. **Accessibility & Browser Support**
10. **Project-Specific Guidelines**

## 🛡️ Security & Performance

### Security Measures

- **Content Security Policy** headers
- **XSS prevention** with input validation
- **Safe coding practices** (no eval(), proper error handling)
- **Dependency audits** with npm audit

### Performance Optimizations

- **Asset optimization** with WebP images and efficient loading
- **Code splitting** with dynamic imports for non-critical features
- **Hardware acceleration** for animations using transform3d()
- **Critical CSS inlining** for above-the-fold content

## 📈 Recent Major Updates

### Aggressive Cleanup (Latest)

- **Removed 990+ lines** of deprecated/unused code
- **Deleted 14 redundant files** while preserving 100% functionality
- **Enhanced guidelines** with zero-tolerance deprecated code policy
- **Streamlined architecture** with logical file organization

### Development Phases Completed

- ✅ **Testing Infrastructure** - Jest framework with comprehensive coverage
- ✅ **Code Modularization** - Component-based architecture implemented
- ✅ **Component Refactoring** - Testable, decoupled components
- ✅ **Test Implementation** - 101 tests across all components
- ✅ **Coverage Optimization** - High-quality test coverage achieved
- ✅ **UI Refactoring** - CSS best practices and unified animations
- ✅ **CI/CD Integration** - Automated testing and deployment pipeline

---

**The Prologue Cyclocross website is production-ready with modern architecture, comprehensive testing, and zero technical debt.**
