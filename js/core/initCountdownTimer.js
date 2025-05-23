export function initCountdownTimer(app) {
  const elements = {
    days: app.getElement('countdown-days'),
    hours: app.getElement('countdown-hours'),
    minutes: app.getElement('countdown-minutes'),
    seconds: app.getElement('countdown-seconds'),
    secondsParent: app.getElement('countdown-seconds')?.parentElement,
  };
  if (elements.days && elements.hours && elements.minutes && elements.seconds) {
    app.components.countdownTimer = new app.CountdownTimer(
      'September 21, 2025 08:00:00',
      elements,
      {
        animationClasses: {
          pulse: 'pulse',
          tick: 'tick',
        },
      }
    );
    app.components.countdownTimer.start();
  }
}
