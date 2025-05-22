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

  // Interactive map functionality
  initInteractiveMap();

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

  // Initialize interactive map
  function initInteractiveMap() {
    const hotspots = document.querySelectorAll('.hotspot');
    const infoPanel = document.querySelector('.map-info-panel');
    const infoContents = document.querySelectorAll('.info-content');
    const infoClose = document.querySelector('.info-close');
    const courseMap = document.querySelector('.course-map');
    const mapHotspots = document.querySelector('.map-hotspots');

    // Function to align hotspot container with actual image dimensions
    function alignHotspotsWithImage() {
      if (courseMap && mapHotspots) {
        // Get the actual rendered dimensions of the image
        const imgRect = courseMap.getBoundingClientRect();
        const containerRect = courseMap.parentElement.getBoundingClientRect();

        // Calculate offsets between container and actual image
        const leftOffset = (containerRect.width - imgRect.width) / 2;
        const topOffset = (containerRect.height - imgRect.height) / 2;

        // Set the hotspot container to match image dimensions and position
        mapHotspots.style.left = `${leftOffset}px`;
        mapHotspots.style.top = `${topOffset}px`;
        mapHotspots.style.width = `${imgRect.width}px`;
        mapHotspots.style.height = `${imgRect.height}px`;
      }
    }

    // Run alignment on load, resize and image load
    window.addEventListener('DOMContentLoaded', alignHotspotsWithImage);
    window.addEventListener('load', alignHotspotsWithImage);
    window.addEventListener('resize', alignHotspotsWithImage);

    // Also run alignment when the image is loaded
    if (courseMap) {
      if (courseMap.complete) {
        alignHotspotsWithImage();
      } else {
        courseMap.addEventListener('load', alignHotspotsWithImage);
      }
    }

    if (hotspots.length && infoPanel) {
      hotspots.forEach(hotspot => {
        hotspot.addEventListener('click', e => {
          e.preventDefault();
          const section = hotspot.getAttribute('data-section');

          // Hide all info contents
          infoContents.forEach(content => {
            content.classList.remove('active');
          });

          // Show the selected content
          const activeContent = document.getElementById(section);
          if (activeContent) {
            activeContent.classList.add('active');
          }

          // Position the info panel next to the clicked dot
          const rect = hotspot.getBoundingClientRect();
          const containerRect = hotspot
            .closest('.interactive-map-container')
            .getBoundingClientRect();

          // Calculate position relative to the map container
          const left = rect.left - containerRect.left + rect.width / 2;
          const top = rect.top - containerRect.top + rect.height / 2;
          infoPanel.style.left = `${left}px`;
          infoPanel.style.top = `${top}px`;

          // Reset any edge positioning classes
          infoPanel.classList.remove('edge-left', 'edge-right', 'edge-top', 'edge-bottom');

          // Show the panel first to properly calculate its dimensions
          infoPanel.classList.add('visible');

          // After panel is visible, check if it's going off screen and adjust if needed
          setTimeout(() => {
            const panelRect = infoPanel.getBoundingClientRect();

            // Check if we're on mobile
            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
              // For mobile, center the panel at the bottom of the map
              infoPanel.style.left = '50%';
              infoPanel.style.top = `${containerRect.height - 10}px`;
              infoPanel.classList.add('edge-bottom');
            } else {
              // Desktop positioning - adjust if panel is going off screen
              const rightOverflow = panelRect.right > containerRect.right - 20;
              const leftOverflow = panelRect.left < containerRect.left + 20;
              const topOverflow = panelRect.top < containerRect.top + 20;
              const bottomOverflow = panelRect.bottom > containerRect.bottom - 20;

              // Apply appropriate edge class based on overflow
              if (rightOverflow) infoPanel.classList.add('edge-right');
              if (leftOverflow) infoPanel.classList.add('edge-left');
              if (topOverflow) infoPanel.classList.add('edge-top');
              if (bottomOverflow) infoPanel.classList.add('edge-bottom');
            }
          }, 10);
        });
      });

      // Close info panel when clicking X
      if (infoClose) {
        infoClose.addEventListener('click', () => {
          infoPanel.classList.remove('visible');
        });
      }

      // Close panel when clicking outside of it
      document.addEventListener('click', e => {
        if (
          infoPanel.classList.contains('visible') &&
          !e.target.closest('.map-info-panel') &&
          !e.target.closest('.hotspot')
        ) {
          infoPanel.classList.remove('visible');
        }
      });
    }
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
