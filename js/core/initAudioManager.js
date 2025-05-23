export function initAudioManager(app) {
  const elements = {
    clickSound: app.getElement('click-sound'),
    soundToggle: app.getElement('sound-toggle'),
    soundIcon: app.getElement('sound-icon'),
  };
  app.components.audioManager = new app.AudioManager({
    elements,
    enabled: true,
    playbackProbability: 0.3,
  });
}
