(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(text) {
    return String(text || '').toLowerCase().trim();
  }

  window.addEventListener('DOMContentLoaded', function () {
    var toggle = qs('[data-menu-toggle]');
    var panel = qs('[data-mobile-panel]');

    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        panel.classList.toggle('is-open');
      });
    }

    qsa('[data-filter-scope]').forEach(function (scope) {
      var input = qs('[data-filter-input]', scope);
      var year = qs('[data-filter-year]', scope);
      var region = qs('[data-filter-region]', scope);
      var clear = qs('[data-filter-clear]', scope);
      var cards = qsa('[data-card]', scope);

      function applyFilters() {
        var keyword = normalize(input && input.value);
        var selectedYear = year ? year.value : '';
        var selectedRegion = region ? region.value : '';

        cards.forEach(function (card) {
          var text = normalize(card.getAttribute('data-keywords'));
          var cardYear = card.getAttribute('data-year') || '';
          var cardRegion = card.getAttribute('data-region') || '';
          var okKeyword = !keyword || text.indexOf(keyword) !== -1;
          var okYear = !selectedYear || cardYear === selectedYear;
          var okRegion = !selectedRegion || cardRegion === selectedRegion;
          card.classList.toggle('is-hidden-card', !(okKeyword && okYear && okRegion));
        });
      }

      [input, year, region].forEach(function (control) {
        if (control) {
          control.addEventListener('input', applyFilters);
          control.addEventListener('change', applyFilters);
        }
      });

      if (clear) {
        clear.addEventListener('click', function () {
          if (input) {
            input.value = '';
          }
          if (year) {
            year.value = '';
          }
          if (region) {
            region.value = '';
          }
          applyFilters();
        });
      }
    });
  });

  window.initMoviePlayer = function (streamUrl) {
    var video = document.getElementById('movieVideo');
    var button = document.getElementById('playerStart');
    var hlsInstance = null;
    var isReady = false;
    var pendingPlay = false;

    if (!video || !button || !streamUrl) {
      return;
    }

    function runPlay() {
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {});
      }
    }

    function prepare() {
      if (isReady) {
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        isReady = true;
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          isReady = true;
          if (pendingPlay) {
            runPlay();
          }
        });
        hlsInstance.on(window.Hls.Events.ERROR, function () {});
        return;
      }

      video.src = streamUrl;
      isReady = true;
    }

    function begin() {
      pendingPlay = true;
      prepare();
      button.classList.add('is-hidden');
      if (isReady || video.src) {
        runPlay();
      }
    }

    button.addEventListener('click', begin);

    video.addEventListener('click', function () {
      if (video.paused) {
        begin();
      }
    });

    video.addEventListener('play', function () {
      button.classList.add('is-hidden');
    });

    video.addEventListener('pause', function () {
      if (!video.ended) {
        button.classList.remove('is-hidden');
      }
    });

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };

  window.renderSearchPage = function () {
    var input = document.querySelector('[data-search-input]');
    var form = document.querySelector('[data-search-form]');
    var status = document.querySelector('[data-search-status]');
    var results = document.querySelector('[data-search-results]');
    var movies = window.SEARCH_MOVIES || [];

    if (!input || !form || !status || !results) {
      return;
    }

    function getQuery() {
      return new URLSearchParams(window.location.search).get('q') || '';
    }

    function card(movie) {
      return [
        '<a class="movie-card" href="' + movie.href + '">',
        '  <span class="poster-wrap">',
        '    <img src="' + movie.cover + '" alt="' + movie.title.replace(/"/g, '&quot;') + '" loading="lazy">',
        '    <span class="play-hover">▶</span>',
        '    <span class="card-cover-badge">' + movie.year + '</span>',
        '  </span>',
        '  <span class="card-body">',
        '    <span class="movie-title">' + movie.title + '</span>',
        '    <span class="movie-summary">' + movie.one + '</span>',
        '    <span class="movie-foot"><span>' + movie.category + '</span><span>' + movie.region + '</span></span>',
        '  </span>',
        '</a>'
      ].join('');
    }

    function escapeText(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function render(query) {
      var q = normalize(query);
      if (!q) {
        status.textContent = '输入关键词开始搜索';
        results.innerHTML = '';
        return;
      }

      var found = movies.filter(function (movie) {
        return normalize(movie.search).indexOf(q) !== -1;
      }).slice(0, 120);

      status.textContent = found.length ? '找到相关剧集' : '未找到相关剧集';
      results.innerHTML = found.map(function (movie) {
        return card({
          title: escapeText(movie.title),
          one: escapeText(movie.one),
          year: escapeText(movie.year),
          region: escapeText(movie.region),
          category: escapeText(movie.category),
          cover: escapeText(movie.cover),
          href: escapeText(movie.href)
        });
      }).join('');
    }

    input.value = getQuery();
    render(input.value);

    input.addEventListener('input', function () {
      render(input.value);
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var q = input.value.trim();
      var url = q ? 'search.html?q=' + encodeURIComponent(q) : 'search.html';
      history.replaceState(null, '', url);
      render(q);
    });
  };
})();
