// Global notification system
export function showNotification(message, type = 'info', duration = 3000) {
  try {
    // Remove existing notification if any
    const existing = document.querySelector('.global-notification');
    if (existing) existing.remove();
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `global-notification global-notification-${type}`;
    notification.textContent = message;
    // Add styles if not present
    if (!document.querySelector('style[data-for="global-notification"]')) {
      const style = document.createElement('style');
      style.setAttribute('data-for', 'global-notification');
      style.textContent = `
        .global-notification {
          position: fixed;
          top: 32px;
          left: 50%;
          transform: translateX(-50%);
          background: #222;
          color: #fff;
          padding: 14px 32px;
          border-radius: 8px;
          font-size: 1.1rem;
          z-index: 99999;
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
          opacity: 0;
          animation: notif-fade-in 0.3s forwards, notif-fade-out 0.3s forwards ${duration - 300}ms;
        }
        .global-notification-success { background: #2e7d32; }
        .global-notification-error { background: #b71c1c; }
        .global-notification-info { background: #222; }
        @keyframes notif-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes notif-fade-out { from { opacity: 1; } to { opacity: 0; } }
      `;
      document.head.appendChild(style);
    }
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), duration);
  } catch (err) {
    console.error('Notification error:', err);
  }
}
// Make available globally
window.showNotification = showNotification;
