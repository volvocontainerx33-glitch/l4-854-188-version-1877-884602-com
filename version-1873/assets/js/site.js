(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('is-open');
    });
  }

  var slider = document.querySelector('[data-hero-slider]');

  if (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
    var index = 0;

    var showSlide = function (nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    };

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        showSlide(dotIndex);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        showSlide(index + 1);
      }, 5200);
    }
  }

  var filterScope = document.querySelector('[data-local-filter]');

  if (filterScope) {
    var searchInput = filterScope.querySelector('[data-local-search]');
    var regionSelect = filterScope.querySelector('[data-filter-region]');
    var genreSelect = filterScope.querySelector('[data-filter-genre]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
    var empty = document.querySelector('[data-empty-result]');

    var normalize = function (value) {
      return String(value || '').toLowerCase().trim();
    };

    var matchAny = function (source, terms) {
      if (!terms) {
        return true;
      }

      var list = terms.split(/\s+/).filter(Boolean);
      return list.some(function (term) {
        return source.indexOf(term.toLowerCase()) !== -1;
      });
    };

    var applyFilter = function () {
      var keyword = normalize(searchInput && searchInput.value);
      var region = normalize(regionSelect && regionSelect.value);
      var genre = normalize(genreSelect && genreSelect.value);
      var visible = 0;

      cards.forEach(function (card) {
        var text = normalize(card.dataset.title + ' ' + card.dataset.region + ' ' + card.dataset.year + ' ' + card.dataset.genre);
        var regionText = normalize(card.dataset.region);
        var genreText = normalize(card.dataset.genre);
        var matched = true;

        if (keyword && text.indexOf(keyword) === -1) {
          matched = false;
        }

        if (region && !matchAny(regionText, region)) {
          matched = false;
        }

        if (genre && genreText.indexOf(genre) === -1) {
          matched = false;
        }

        card.style.display = matched ? '' : 'none';

        if (matched) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    };

    [searchInput, regionSelect, genreSelect].forEach(function (node) {
      if (node) {
        node.addEventListener('input', applyFilter);
        node.addEventListener('change', applyFilter);
      }
    });
  }

  var searchRoot = document.querySelector('[data-search-results]');

  if (searchRoot && window.SEARCH_DATA) {
    var params = new URLSearchParams(window.location.search);
    var query = String(params.get('q') || '').trim();
    var title = document.querySelector('[data-search-title]');
    var hint = document.querySelector('[data-search-hint]');

    var escapeHtml = function (value) {
      return String(value || '').replace(/[&<>"']/g, function (char) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[char];
      });
    };

    var cardTemplate = function (movie) {
      var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
        return '<span>' + escapeHtml(tag) + '</span>';
      }).join('');

      return [
        '<article class="movie-card movie-card-grid">',
        '  <a class="poster-link" href="' + escapeHtml(movie.href) + '" aria-label="' + escapeHtml(movie.title) + '">',
        '    <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
        '    <span class="poster-shade"></span>',
        '    <span class="play-badge">▶</span>',
        '    <span class="duration-badge">' + escapeHtml(movie.duration) + '</span>',
        '  </a>',
        '  <div class="card-body">',
        '    <div class="card-meta"><span>' + escapeHtml(movie.group) + '</span><span>' + escapeHtml(movie.year) + '</span></div>',
        '    <h3><a href="' + escapeHtml(movie.href) + '">' + escapeHtml(movie.title) + '</a></h3>',
        '    <p>' + escapeHtml(movie.oneLine) + '</p>',
        '    <div class="tag-row">' + tags + '</div>',
        '  </div>',
        '</article>'
      ].join('');
    };

    if (title) {
      title.textContent = query ? '搜索：' + query : '搜索电影';
    }

    if (!query) {
      if (hint) {
        hint.textContent = '输入片名、地区、年份或类型，快速找到想看的影片。';
      }
      searchRoot.innerHTML = '';
      return;
    }

    var normalized = query.toLowerCase();
    var results = window.SEARCH_DATA.filter(function (movie) {
      return [movie.title, movie.region, movie.year, movie.genre, movie.oneLine, (movie.tags || []).join(' ')]
        .join(' ')
        .toLowerCase()
        .indexOf(normalized) !== -1;
    });

    if (hint) {
      hint.textContent = results.length ? '以下影片与搜索内容匹配。' : '暂无匹配影片，可以尝试更换关键词。';
    }

    searchRoot.innerHTML = results.map(cardTemplate).join('');
  }
}());
