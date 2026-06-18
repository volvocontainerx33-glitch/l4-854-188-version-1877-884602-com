(function () {
    function all(selector, parent) {
        return Array.prototype.slice.call((parent || document).querySelectorAll(selector));
    }

    var menuButton = document.querySelector('[data-menu-button]');
    var mobilePanel = document.querySelector('[data-mobile-panel]');
    if (menuButton && mobilePanel) {
        menuButton.addEventListener('click', function () {
            mobilePanel.classList.toggle('open');
        });
    }

    var slides = all('[data-hero-slide]');
    var dots = all('[data-hero-dot]');
    if (slides.length > 1) {
        var current = 0;
        function showSlide(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('active', i === current);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('active', i === current);
            });
        }
        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                showSlide(i);
            });
        });
        window.setInterval(function () {
            showSlide(current + 1);
        }, 6500);
    }

    var filterInput = document.querySelector('[data-local-filter]');
    var yearFilter = document.querySelector('[data-year-filter]');
    var emptyState = document.querySelector('[data-empty-state]');
    var cards = all('.movie-card[data-keywords]');

    function normalize(value) {
        return String(value || '').toLowerCase().replace(/\s+/g, '');
    }

    function applyFilters() {
        if (!cards.length) {
            return;
        }
        var keyword = normalize(filterInput ? filterInput.value : '');
        var year = yearFilter ? yearFilter.value : '';
        var visible = 0;
        cards.forEach(function (card) {
            var haystack = normalize(card.getAttribute('data-keywords'));
            var cardYear = card.getAttribute('data-year') || '';
            var matchedKeyword = !keyword || haystack.indexOf(keyword) !== -1;
            var matchedYear = !year || cardYear === year;
            var show = matchedKeyword && matchedYear;
            card.style.display = show ? '' : 'none';
            if (show) {
                visible += 1;
            }
        });
        if (emptyState) {
            emptyState.classList.toggle('show', visible === 0);
        }
    }

    if (filterInput || yearFilter) {
        var params = new URLSearchParams(window.location.search);
        var q = params.get('q') || '';
        if (q && filterInput) {
            filterInput.value = q;
        }
        if (filterInput) {
            filterInput.addEventListener('input', applyFilters);
        }
        if (yearFilter) {
            yearFilter.addEventListener('change', applyFilters);
        }
        all('[data-filter-chip]').forEach(function (chip) {
            chip.addEventListener('click', function () {
                if (filterInput) {
                    filterInput.value = chip.getAttribute('data-filter-chip') || chip.textContent || '';
                    applyFilters();
                }
            });
        });
        applyFilters();
    }
})();
