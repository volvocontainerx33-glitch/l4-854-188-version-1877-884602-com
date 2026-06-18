(function () {
  function bySelector(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setupMobileMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener('click', function () {
      panel.classList.toggle('is-open');
      toggle.textContent = panel.classList.contains('is-open') ? '×' : '☰';
    });
  }

  function setupImageFallbacks() {
    document.addEventListener('error', function (event) {
      var target = event.target;
      if (!target || target.tagName !== 'IMG') {
        return;
      }
      target.classList.add('is-missing');
      if (target.parentElement) {
        target.parentElement.classList.add('image-missing');
      }
      var slide = target.closest('.hero-slide');
      if (slide) {
        slide.classList.add('image-missing');
      }
    }, true);
  }

  function setupHero() {
    var root = document.querySelector('[data-hero]');
    if (!root) {
      return;
    }
    var slides = bySelector('[data-hero-slide]', root);
    var dots = bySelector('[data-hero-dot]', root);
    var prev = root.querySelector('[data-hero-prev]');
    var next = root.querySelector('[data-hero-next]');
    var index = 0;
    var timer;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    if (!slides.length) {
      return;
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    start();
  }

  function textOfCard(card) {
    return [
      card.getAttribute('data-title'),
      card.getAttribute('data-region'),
      card.getAttribute('data-type'),
      card.getAttribute('data-year'),
      card.getAttribute('data-genre'),
      card.getAttribute('data-category'),
      card.textContent
    ].join(' ').toLowerCase();
  }

  function setupFilters() {
    var scope = document.querySelector('[data-filter-scope]');
    var list = document.querySelector('[data-filter-list]');
    if (!scope || !list) {
      return;
    }
    var textInput = scope.querySelector('[data-filter-text]');
    var fields = bySelector('[data-filter-field]', scope);
    var reset = scope.querySelector('[data-filter-reset]');
    var result = scope.querySelector('[data-filter-result]');
    var cards = bySelector('.movie-card, .rank-card', list);

    function apply() {
      var query = textInput ? textInput.value.trim().toLowerCase() : '';
      var visible = 0;
      cards.forEach(function (card) {
        var ok = true;
        if (query && textOfCard(card).indexOf(query) === -1) {
          ok = false;
        }
        fields.forEach(function (field) {
          var attr = field.getAttribute('data-filter-field');
          var value = field.value;
          if (value && card.getAttribute(attr) !== value) {
            ok = false;
          }
        });
        card.style.display = ok ? '' : 'none';
        if (ok) {
          visible += 1;
        }
      });
      if (result) {
        result.textContent = '当前显示 ' + visible + ' / ' + cards.length + ' 条内容';
      }
    }

    if (textInput) {
      textInput.addEventListener('input', apply);
    }
    fields.forEach(function (field) {
      field.addEventListener('change', apply);
    });
    if (reset) {
      reset.addEventListener('click', function () {
        if (textInput) {
          textInput.value = '';
        }
        fields.forEach(function (field) {
          field.value = '';
        });
        apply();
      });
    }
    apply();
  }

  function buildCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');
    return [
      '<article class="movie-card">',
      '  <a class="card-link" href="./' + escapeHtml(movie.page) + '">',
      '    <span class="cover-shell">',
      '      <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '      <span class="play-float">▶</span>',
      '      <span class="duration-badge">' + escapeHtml(movie.duration) + '</span>',
      '    </span>',
      '    <span class="card-body">',
      '      <strong class="card-title">' + escapeHtml(movie.title) + '</strong>',
      '      <span class="card-desc">' + escapeHtml(movie.oneLine) + '</span>',
      '      <span class="card-meta">',
      '        <em>' + escapeHtml(movie.category) + '</em>',
      '        <i>' + escapeHtml(movie.region) + '</i>',
      '        <i>' + escapeHtml(movie.year) + '</i>',
      '      </span>',
      '      <span class="tag-row">' + tags + '</span>',
      '    </span>',
      '  </a>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setupSearchPage() {
    var results = document.querySelector('[data-search-results]');
    var input = document.querySelector('[data-search-input]');
    var status = document.querySelector('[data-search-status]');
    if (!results || !input || !window.MOVIES) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    input.value = query;

    function render() {
      var keyword = input.value.trim().toLowerCase();
      var matched = window.MOVIES.filter(function (movie) {
        if (!keyword) {
          return false;
        }
        return [
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          movie.oneLine,
          (movie.tags || []).join(' ')
        ].join(' ').toLowerCase().indexOf(keyword) !== -1;
      }).slice(0, 240);
      results.innerHTML = matched.map(buildCard).join('');
      if (status) {
        status.textContent = keyword
          ? '找到 ' + matched.length + ' 条匹配结果，最多显示前 240 条。'
          : '请输入关键词或从顶部搜索进入。';
      }
    }

    input.addEventListener('input', render);
    render();
  }

  function setupPlayer() {
    var player = document.querySelector('[data-player]');
    if (!player) {
      return;
    }
    var video = player.querySelector('video');
    var button = player.querySelector('.play-button');
    var status = player.querySelector('[data-player-status]');
    var source = player.getAttribute('data-source');
    var loaded = false;
    var hlsInstance = null;

    function setStatus(message) {
      if (status) {
        status.textContent = message;
      }
    }

    function playVideo() {
      if (!video || !source) {
        setStatus('播放源不可用。');
        return;
      }
      if (loaded) {
        video.play();
        return;
      }
      loaded = true;
      video.controls = true;
      setStatus('正在加载播放源...');

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.addEventListener('loadedmetadata', function () {
          video.play();
          setStatus('正在播放');
        }, { once: true });
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          video.play();
          setStatus('正在播放');
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setStatus('播放加载失败，请刷新页面后重试。');
            if (hlsInstance) {
              hlsInstance.destroy();
              hlsInstance = null;
            }
          }
        });
      } else {
        video.src = source;
        setStatus('当前浏览器不支持 HLS 自动解析，请更换浏览器或启用 HLS 支持。');
      }

      if (button) {
        button.classList.add('is-hidden');
      }
    }

    if (button) {
      button.addEventListener('click', playVideo);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileMenu();
    setupImageFallbacks();
    setupHero();
    setupFilters();
    setupSearchPage();
    setupPlayer();
  });
})();
