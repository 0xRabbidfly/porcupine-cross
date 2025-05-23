export function setupAudioPlayButton() {
  const playBtn = document.querySelector('.audio-play-btn');
  const audio = document.getElementById('race-day-audio');
  if (!playBtn || !audio) return;

  let isPlaying = false;

  function updateIcon() {
    playBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    playBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
  }

  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      isPlaying = true;
    } else {
      audio.pause();
      isPlaying = false;
    }
    updateIcon();
  });

  // Keyboard accessibility
  playBtn.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      playBtn.click();
    }
  });

  // Update icon if audio ends
  audio.addEventListener('ended', () => {
    isPlaying = false;
    updateIcon();
  });

  // Sync icon if paused by other means
  audio.addEventListener('pause', () => {
    isPlaying = false;
    updateIcon();
  });
  audio.addEventListener('play', () => {
    isPlaying = true;
    updateIcon();
  });

  updateIcon();
}
