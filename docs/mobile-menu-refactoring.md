# Mobile Menu Refactoring Plan

## Current Implementation Issues
- Inline styles with !important flags in index.html
- Direct style manipulation in JavaScript (main.js)
- Timeout-based animation management
- Event propagation issues

## Refactoring Steps

### Step 1: CSS Architecture
1. Create a dedicated mobile-menu.css file or section in style.css
2. Define proper CSS classes for menu states:
   - `.menu-visible` / `.menu-hidden` for visibility states
   - `.menu-animating` for transition states
   - Use transform and opacity for animations instead of display/visibility

### Step 2: HTML Cleanup
1. Remove all inline styles from index.html
2. Update mobile menu markup for better semantics
3. Add proper ARIA attributes for accessibility

### Step 3: JavaScript Refactoring
1. Replace direct style manipulation with class toggling
2. Use transitionend events instead of setTimeout
3. Implement proper state machine for menu
4. Fix event propagation with event delegation
5. Create clean API for menu interactions

## Implementation Details

### CSS Classes
```css
/* Mobile menu base state (hidden) */
@media (max-width: 768px) {
  nav#main-nav {
    position: absolute;
    top: var(--header-height-mobile);
    left: 0;
    width: 100%;
    background-color: white;
    z-index: 9999;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    transform: translateY(-100%);
    opacity: 0;
    transition: transform 0.3s ease-out, opacity 0.3s ease-out;
    pointer-events: none;
  }

  /* Mobile menu visible state */
  nav#main-nav.open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  /* Mobile menu links */
  nav#main-nav a {
    display: block;
    padding: 12px 20px;
    width: 100%;
    box-sizing: border-box;
    text-align: left;
    font-size: 16px;
    border-bottom: 1px solid #eee;
  }

  nav#main-nav a:last-child {
    border-bottom: none;
  }
}
```

### JavaScript Approach
```javascript
// Menu state management
const menuState = {
  isOpen: false,
  isAnimating: false,
  
  // Open menu with animation
  open() {
    if (this.isAnimating || this.isOpen) return;
    this.isAnimating = true;
    this.isOpen = true;
    
    const mainNav = document.getElementById('main-nav');
    const menuToggle = document.getElementById('menu-toggle');
    
    mainNav.classList.add('open');
    menuToggle.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
    
    // Clear animation state after transition
    mainNav.addEventListener('transitionend', () => {
      this.isAnimating = false;
    }, { once: true });
  },
  
  // Close menu with animation
  close() {
    if (this.isAnimating || !this.isOpen) return;
    this.isAnimating = true;
    this.isOpen = false;
    
    const mainNav = document.getElementById('main-nav');
    const menuToggle = document.getElementById('menu-toggle');
    
    mainNav.classList.remove('open');
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    
    // Clear animation state after transition
    mainNav.addEventListener('transitionend', () => {
      this.isAnimating = false;
    }, { once: true });
  },
  
  // Toggle menu state
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
};
```

## Testing Plan
1. Update mobileMenu.test.js to test new state machine
2. Add tests for transitionend events
3. Test menu state transitions and animation blocking
4. Verify event propagation handling

## Migration Strategy
1. Create new CSS classes without removing old ones
2. Implement new JavaScript alongside existing code
3. Test both implementations in parallel
4. Switch to new implementation when verified
5. Remove old code 