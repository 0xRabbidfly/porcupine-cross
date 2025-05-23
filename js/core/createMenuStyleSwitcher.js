export function createMenuStyleSwitcher(app) {
  try {
    if (!window.location.search.includes('dev=true')) return;
    const styleSwitcher = document.createElement('div');
    styleSwitcher.className = 'menu-style-switcher';
    styleSwitcher.innerHTML = `
      <div class="style-switcher-label">Menu Animation:</div>
      <div class="style-switcher-options">
        <button data-style="default" class="active">Default</button>
        <button data-style="flip">Flip</button>
        <button data-style="slide">Slide</button>
      </div>
    `;
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .menu-style-switcher {
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #ddd;
        border-radius: 5px;
        padding: 8px;
        font-size: 12px;
        z-index: 9999;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
      }
      .style-switcher-label {
        margin-bottom: 5px;
        font-weight: bold;
        font-size: 11px;
      }
      .style-switcher-options {
        display: flex;
        gap: 5px;
      }
      .style-switcher-options button {
        border: 1px solid #ccc;
        background: #f5f5f5;
        border-radius: 3px;
        padding: 4px 8px;
        font-size: 11px;
        cursor: pointer;
      }
      .style-switcher-options button.active {
        background: #e73e3a;
        color: white;
        border-color: #e73e3a;
      }
      .style-switcher-options button:hover:not(.active) {
        background: #eee;
      }
    `;
    styleSwitcher.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', () => {
        styleSwitcher.querySelectorAll('button').forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');
        const style = button.getAttribute('data-style');
        app.components.mobileMenu.setAnimationStyle(style);
        app.showTestNotification('Animation style changed! Open menu to test.');
      });
    });
    document.head.appendChild(styleElement);
    document.body.appendChild(styleSwitcher);
  } catch (error) {
    console.error('Error creating menu style switcher:', error);
  }
}
