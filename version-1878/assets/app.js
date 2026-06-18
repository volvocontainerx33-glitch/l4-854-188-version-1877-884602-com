(function () {
  const body = document.body;
  const mobileToggle = document.querySelector('[data-mobile-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', function () {
      const opened = mobileNav.classList.toggle('open');
      body.classList.toggle('menu-open', opened);
      mobileToggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
    });
  }

  document.querySelectorAll('img[data-fallback]').forEach(function (img) {
    img.addEventListener('error', function () {
      img.style.opacity = '0';
      img.setAttribute('aria-hidden', 'true');
    });
  });

  function initHero() {
    const hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }

    const slides = Array.from(hero.querySelectorAll('.hero-slide'));
    const dots = Array.from(hero.querySelectorAll('.hero-dot'));
    const prev = hero.querySelector('[data-hero-prev]');
    const next = hero.querySelector('[data-hero-next]');
    let index = Math.max(0, slides.findIndex(function (slide) {
      return slide.classList.contains('active');
    }));
    let timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
        dot.setAttribute('aria-current', dotIndex === index ? 'true' : 'false');
      });
    }

    function schedule() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        schedule();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        schedule();
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        schedule();
      });
    });

    show(index);
    schedule();
  }

  function loadHlsLibrary(callback) {
    if (window.Hls) {
      callback();
      return;
    }

    const existing = document.querySelector('script[data-hls-loader]');
    if (existing) {
      existing.addEventListener('load', callback, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
    script.async = true;
    script.setAttribute('data-hls-loader', 'true');
    script.addEventListener('load', callback, { once: true });
    script.addEventListener('error', function () {
      callback();
    }, { once: true });
    document.head.appendChild(script);
  }

  function attachStream(video, streamUrl) {
    if (!video || !streamUrl) {
      return;
    }

    if (video._hlsInstance) {
      video._hlsInstance.destroy();
      video._hlsInstance = null;
    }

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (!data || !data.fatal) {
          return;
        }
        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          hls.destroy();
        }
      });
      video._hlsInstance = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
    } else {
      video.src = streamUrl;
    }
  }

  function initPlayers() {
    document.querySelectorAll('[data-player]').forEach(function (player) {
      const video = player.querySelector('video');
      const overlayButton = player.querySelector('[data-play-button]');
      const shell = player.querySelector('.video-shell');
      const sourceButtons = Array.from(player.querySelectorAll('[data-video-src]'));
      let activeSource = player.getAttribute('data-default-src') || (sourceButtons[0] && sourceButtons[0].getAttribute('data-video-src'));
      let prepared = false;

      function setSource(button) {
        if (!button) {
          return;
        }
        activeSource = button.getAttribute('data-video-src');
        sourceButtons.forEach(function (sourceButton) {
          sourceButton.classList.toggle('active', sourceButton === button);
        });
        prepared = false;
      }

      function startPlayback() {
        if (!video || !activeSource) {
          return;
        }

        loadHlsLibrary(function () {
          if (!prepared) {
            attachStream(video, activeSource);
            prepared = true;
          }
          if (shell) {
            shell.classList.add('is-playing');
          }
          const playPromise = video.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {
              video.setAttribute('controls', 'controls');
            });
          }
        });
      }

      if (sourceButtons.length) {
        setSource(sourceButtons[0]);
      }

      sourceButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          setSource(button);
          startPlayback();
        });
      });

      if (overlayButton) {
        overlayButton.addEventListener('click', startPlayback);
      }

      if (video) {
        video.addEventListener('play', function () {
          if (shell) {
            shell.classList.add('is-playing');
          }
        });
      }
    });
  }

  function initSearchFilter() {
    const root = document.querySelector('[data-filter-root]');
    if (!root) {
      return;
    }

    const queryInput = root.querySelector('[data-filter-query]');
    const typeInput = root.querySelector('[data-filter-type]');
    const regionInput = root.querySelector('[data-filter-region]');
    const status = root.querySelector('[data-filter-status]');
    const cards = Array.from(root.querySelectorAll('[data-movie-card]'));

    function normalize(value) {
      return String(value || '').trim().toLowerCase();
    }

    function update() {
      const query = normalize(queryInput && queryInput.value);
      const type = normalize(typeInput && typeInput.value);
      const region = normalize(regionInput && regionInput.value);
      let visible = 0;

      cards.forEach(function (card) {
        const text = normalize(card.getAttribute('data-search-text'));
        const cardType = normalize(card.getAttribute('data-type'));
        const cardRegion = normalize(card.getAttribute('data-region'));
        const ok = (!query || text.includes(query)) && (!type || cardType.includes(type)) && (!region || cardRegion.includes(region));
        card.style.display = ok ? '' : 'none';
        if (ok) {
          visible += 1;
        }
      });

      if (status) {
        status.textContent = '当前显示 ' + visible + ' 部影片，共 ' + cards.length + ' 部。';
      }
    }

    [queryInput, typeInput, regionInput].forEach(function (input) {
      if (input) {
        input.addEventListener('input', update);
        input.addEventListener('change', update);
      }
    });

    update();
  }

  initHero();
  initPlayers();
  initSearchFilter();
})();
