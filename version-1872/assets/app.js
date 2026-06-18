(function () {
  var body = document.body;
  var menuButton = document.querySelector('[data-mobile-menu]');

  if (menuButton) {
    menuButton.addEventListener('click', function () {
      body.classList.toggle('mobile-open');
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
  var activeIndex = 0;
  var timer = null;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }

    activeIndex = (index + slides.length) % slides.length;

    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('active', slideIndex === activeIndex);
    });

    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('active', dotIndex === activeIndex);
    });
  }

  function startHero() {
    if (timer) {
      clearInterval(timer);
    }

    timer = setInterval(function () {
      showSlide(activeIndex + 1);
    }, 5200);
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      showSlide(index);
      startHero();
    });
  });

  if (slides.length > 1) {
    startHero();
  }

  var params = new URLSearchParams(window.location.search);
  var queryFromUrl = params.get('q') || '';
  var searchInput = document.querySelector('[data-search-input]');
  var categoryFilter = document.querySelector('[data-category-filter]');
  var typeFilter = document.querySelector('[data-type-filter]');
  var yearFilter = document.querySelector('[data-year-filter]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
  var status = document.querySelector('[data-search-status]');

  if (searchInput && queryFromUrl) {
    searchInput.value = queryFromUrl;
  }

  function includesText(source, value) {
    return String(source || '').toLowerCase().indexOf(String(value || '').toLowerCase()) !== -1;
  }

  function filterCards() {
    if (!cards.length) {
      return;
    }

    var query = searchInput ? searchInput.value.trim() : '';
    var category = categoryFilter ? categoryFilter.value : '';
    var typeValue = typeFilter ? typeFilter.value : '';
    var minYear = yearFilter && yearFilter.value ? parseInt(yearFilter.value, 10) : 0;
    var visible = 0;

    cards.forEach(function (card) {
      var text = [
        card.getAttribute('data-title'),
        card.getAttribute('data-region'),
        card.getAttribute('data-type'),
        card.getAttribute('data-year'),
        card.getAttribute('data-tags')
      ].join(' ');
      var cardCategory = card.getAttribute('data-category') || '';
      var cardType = card.getAttribute('data-type') || '';
      var cardTags = card.getAttribute('data-tags') || '';
      var cardYear = parseInt(card.getAttribute('data-year') || '0', 10);
      var matchQuery = !query || includesText(text, query);
      var matchCategory = !category || includesText(cardCategory, category);
      var matchType = !typeValue || includesText(cardType + ' ' + cardTags, typeValue);
      var matchYear = !minYear || cardYear >= minYear;
      var matched = matchQuery && matchCategory && matchType && matchYear;

      card.hidden = !matched;

      if (matched) {
        visible += 1;
      }
    });

    if (status) {
      status.hidden = visible !== 0;
    }
  }

  [searchInput, categoryFilter, typeFilter, yearFilter].forEach(function (element) {
    if (element) {
      element.addEventListener('input', filterCards);
      element.addEventListener('change', filterCards);
    }
  });

  filterCards();
})();
