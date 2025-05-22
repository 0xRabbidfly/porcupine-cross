/* global clearInterval, setInterval, IntersectionObserver */

// Future JavaScript code can go here

// Smooth scrolling for anchor links (optional)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetElement = document.querySelector(this.getAttribute('href'));
    if (targetElement) {
      // Calculate offset due to sticky header
      const headerOffset = 100; // Match this with body padding-top
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  });
});

// Dynamic Hero Load-in & Section Scroll Animations
document.addEventListener('DOMContentLoaded', () => {
  // Sound effects management - simplified to only click sound
  let soundEnabled = true;
  const soundToggle = document.getElementById('sound-toggle');
  const soundIcon = document.getElementById('sound-icon');
  const clickSound = document.getElementById('click-sound');

  // Prime audio on first user interaction for mobile compatibility
  let audioPrimed = false;
  function primeAudio() {
    if (!audioPrimed) {
      clickSound
        .play()
        .then(() => {
          clickSound.pause();
          clickSound.currentTime = 0;
          audioPrimed = true;
        })
        .catch(() => {});
    }
  }
  window.addEventListener('touchstart', primeAudio, { once: true });
  window.addEventListener('click', primeAudio, { once: true });

  // Initialize countdown timer
  initCountdown();

  // Interactive map is now handled by the modular component system
  // No need to initialize it here

  // Sound toggle functionality
  if (soundToggle && soundIcon) {
    soundToggle.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      if (soundEnabled) {
        soundIcon.className = 'fa fa-volume-up';
        soundToggle.classList.remove('muted');
        playSound(clickSound);
      } else {
        soundIcon.className = 'fa fa-volume-mute';
        soundToggle.classList.add('muted');
      }
    });
  }

  // Play sound function with safety checks
  function playSound(soundElement) {
    // Only play the sound 40% of the time
    if (Math.random() < 0.4 && soundEnabled && soundElement && soundElement.readyState >= 2) {
      try {
        soundElement.currentTime = 0;
        soundElement.play().catch(err => {
          // Suppress errors - browser might block autoplay until user interaction
          console.warn('Sound play prevented:', err);
        });
      } catch (err) {
        // Fallback for any errors
        console.warn('Error playing sound:', err);
      }
    }
  }

  // Initialize countdown timer (without tick sound)
  function initCountdown() {
    const raceDate = new Date('September 21, 2025 08:00:00').getTime();
    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minutesEl = document.getElementById('countdown-minutes');
    const secondsEl = document.getElementById('countdown-seconds');

    // Only proceed if all elements exist
    if (!(daysEl && hoursEl && minutesEl && secondsEl)) return;

    let lastSeconds = -1; // Track last second value to detect changes

    // Update countdown every second
    function updateCountdown() {
      const now = new Date().getTime();
      const distance = raceDate - now;

      // Calculate time units
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // Update display with padding
      daysEl.textContent = days.toString().padStart(2, '0');
      hoursEl.textContent = hours.toString().padStart(2, '0');
      minutesEl.textContent = minutes.toString().padStart(2, '0');
      secondsEl.textContent = seconds.toString().padStart(2, '0');

      // Add animation class on seconds change (no sound)
      if (seconds !== lastSeconds) {
        // Add and remove pulse animation
        secondsEl.parentElement.classList.add('pulse');
        secondsEl.parentElement.classList.add('tick');

        setTimeout(() => {
          secondsEl.parentElement.classList.remove('pulse');
        }, 700);

        setTimeout(() => {
          secondsEl.parentElement.classList.remove('tick');
        }, 1500);

        lastSeconds = seconds;
      }

      // If countdown finished
      if (distance < 0) {
        clearInterval(countdownInterval);
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';

        // Add a race day message
        const countdownContainer = document.querySelector('.countdown-container');
        if (countdownContainer) {
          countdownContainer.innerHTML = '<h3 class="countdown-title">Race Day Is Here!</h3>';
        }
      }
    }

    // Initial call to avoid delay
    updateCountdown();

    // Set interval for updates
    const countdownInterval = setInterval(updateCountdown, 1000);
  }

  // Hero animation trigger
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    // Use AnimationSystem instead of setTimeout
    if (window.AnimationSystem) {
      window.AnimationSystem.animate(heroSection, 'fade-in', {
        duration: 500,
        variables: { '--hero-opacity': '1' },
      });
    } else {
      // Fallback if AnimationSystem is not available
      setTimeout(() => {
        heroSection.classList.add('loaded');
      }, 500);
    }
  }

  // Intersection Observer for scroll animations
  const animatedSections = document.querySelectorAll('section'); // Target all sections

  const observerOptions = {
    root: null, // relative to document viewport
    rootMargin: '0px',
    threshold: 0.1, // 10% of the section is visible
  };

  const sectionObserver = new IntersectionObserver((entries, observerInstance) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observerInstance.unobserve(entry.target); // Optional: stop observing once animated
      }
    });
  }, observerOptions);

  animatedSections.forEach(section => {
    sectionObserver.observe(section);
  });

  // Track menu state
  let isMenuOpen = false;

  // Mobile menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const mainNav = document.getElementById('main-nav');

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', function (e) {
      e.preventDefault();
      isMenuOpen = !isMenuOpen; // Toggle menu state

      if (isMenuOpen) {
        mainNav.classList.add('open');
        menuToggle.classList.add('open');
      } else {
        mainNav.classList.remove('open');
        menuToggle.classList.remove('open');
      }

      menuToggle.setAttribute('aria-expanded', isMenuOpen ? 'true' : 'false');
    });
  }

  // Single event handler for all nav link clicks
  document.querySelectorAll('#main-nav a').forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');

      // Only trigger mud splatter for internal anchor links in mobile when menu is open
      if (window.innerWidth <= 768 && isMenuOpen && href && href.startsWith('#')) {
        event.preventDefault(); // Prevent default navigation temporarily

        // Play click sound
        playSound(clickSound);

        // Create the splatter effect
        if (window.AnimationSystem) {
          window.AnimationSystem.createViewportSplat({ mobile: true });
        }

        // Tactile feedback if available
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate([10, 30, 10]);
        }

        // Set menu state to closed
        isMenuOpen = false;

        // Close menu with delay to ensure splatter is visible
        setTimeout(() => {
          if (menuToggle) {
            menuToggle.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
          }
          mainNav.classList.remove('open');
        }, 800);

        // Navigate after a slight delay
        setTimeout(() => {
          const targetElement = document.querySelector(href);
          if (targetElement) {
            const headerOffset = window.innerWidth <= 768 ? 60 : 90;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
          }
        }, 850);
      } else {
        // For regular navigation or non-mobile, just handle normally
        if (href && href.startsWith('#')) {
          event.preventDefault();
          const targetElement = document.querySelector(href);
          if (targetElement) {
            const headerOffset = window.innerWidth <= 768 ? 60 : 90;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
          }

          // Still close menu if it's open
          if (window.innerWidth <= 768 && isMenuOpen) {
            isMenuOpen = false; // Update state
            if (menuToggle) {
              menuToggle.classList.remove('open');
              menuToggle.setAttribute('aria-expanded', 'false');
            }
            mainNav.classList.remove('open');
          }
        }
      }
    });
  });

  // Event listeners for individual splatters (CTA buttons and Desktop Nav links)
  const ctaButtons = document.querySelectorAll('.cta-button');
  ctaButtons.forEach(button => {
    button.addEventListener('click', event => {
      if (window.AnimationSystem) {
        window.AnimationSystem.createMudSplat(event.currentTarget);
      }
      playSound(clickSound);
    });
  });

  // Apply individual splatter to desktop nav links only, not mobile (mobile gets viewport splatter)
  const desktopNavLinks = document.querySelectorAll('nav#main-nav a');
  desktopNavLinks.forEach(link => {
    link.addEventListener('click', event => {
      if (window.innerWidth > 768 && window.AnimationSystem) {
        // Only apply if not in mobile view
        window.AnimationSystem.createMudSplat(event.currentTarget);
        playSound(clickSound);
      }
    });
  });
});
