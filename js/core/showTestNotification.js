export function showTestNotification(app, message) {
  try {
    const existingNotification = document.querySelector('.test-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    const notification = document.createElement('div');
    notification.className = 'test-notification';
    notification.textContent = message;
    const styleElement = document.createElement('style');
    if (!document.querySelector('style[data-for="notification"]')) {
      styleElement.setAttribute('data-for', 'notification');
      styleElement.textContent = `
        .test-notification {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 10px 20px;
          border-radius: 5px;
          z-index: 10000;
          font-size: 14px;
          animation: notification-fade 3s forwards;
        }
        @keyframes notification-fade {
          0% { opacity: 0; transform: translate(-50%, -20px); }
          10% { opacity: 1; transform: translate(-50%, 0); }
          90% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -20px); }
        }
      `;
      document.head.appendChild(styleElement);
    }
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}
