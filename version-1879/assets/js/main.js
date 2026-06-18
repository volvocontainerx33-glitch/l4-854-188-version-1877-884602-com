(function () {
    function ready(callback) {
        if (document.readyState !== 'loading') {
            callback();
            return;
        }

        document.addEventListener('DOMContentLoaded', callback);
    }

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    ready(function () {
        var header = document.querySelector('[data-site-header]');
        var toggle = document.querySelector('[data-mobile-toggle]');
        var panel = document.querySelector('[data-mobile-panel]');

        function updateHeader() {
            if (!header) {
                return;
            }

            if (window.scrollY > 18) {
                header.classList.add('is-scrolled');
            } else {
                header.classList.remove('is-scrolled');
            }
        }

        updateHeader();
        window.addEventListener('scroll', updateHeader, { passive: true });

        if (toggle && panel && header) {
            toggle.addEventListener('click', function () {
                panel.classList.toggle('is-open');
                header.classList.toggle('is-open', panel.classList.contains('is-open'));
            });
        }

        document.querySelectorAll('[data-search-form]').forEach(function (form) {
            form.addEventListener('submit', function (event) {
                var input = form.querySelector('[data-search-input]');
                var query = input ? input.value.trim() : '';

                if (!query) {
                    event.preventDefault();
                    return;
                }

                event.preventDefault();
                window.location.href = 'index.html?q=' + encodeURIComponent(query);
            });
        });

        initHero();
        initFilters();
    });

    function initHero() {
        var hero = document.querySelector('[data-hero]');
        if (!hero) {
            return;
        }

        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var prev = hero.querySelector('[data-hero-prev]');
        var next = hero.querySelector('[data-hero-next]');
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;

            slides.forEach(function (slide, position) {
                slide.classList.toggle('is-active', position === index);
            });

            dots.forEach(function (dot, position) {
                dot.classList.toggle('is-active', position === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
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

        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function initFilters() {
        var panel = document.querySelector('[data-filter-panel]');
        if (!panel) {
            return;
        }

        var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
        var keywordInput = panel.querySelector('[data-local-search]');
        var selects = Array.prototype.slice.call(panel.querySelectorAll('[data-filter]'));
        var emptyState = panel.querySelector('[data-empty-state]');
        var urlQuery = new URLSearchParams(window.location.search).get('q') || '';

        if (keywordInput && urlQuery) {
            keywordInput.value = urlQuery;
        }

        function applyFilters() {
            var query = normalize(keywordInput ? keywordInput.value : '');
            var activeFilters = {};
            var visibleCount = 0;

            selects.forEach(function (select) {
                activeFilters[select.getAttribute('data-filter')] = normalize(select.value);
            });

            cards.forEach(function (card) {
                var haystack = normalize([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-genre'),
                    card.getAttribute('data-tags'),
                    card.textContent
                ].join(' '));

                var matchesQuery = !query || haystack.indexOf(query) !== -1;
                var matchesFilters = Object.keys(activeFilters).every(function (key) {
                    var expected = activeFilters[key];
                    var actual = normalize(card.getAttribute('data-' + key));
                    return !expected || actual === expected;
                });
                var visible = matchesQuery && matchesFilters;

                card.classList.toggle('is-hidden', !visible);

                if (visible) {
                    visibleCount += 1;
                }
            });

            if (emptyState) {
                emptyState.classList.toggle('is-visible', visibleCount === 0);
            }
        }

        if (keywordInput) {
            keywordInput.addEventListener('input', applyFilters);
        }

        selects.forEach(function (select) {
            select.addEventListener('change', applyFilters);
        });

        applyFilters();
    }

    window.initMoviePlayer = function (videoId, streamUrl) {
        var video = document.getElementById(videoId);
        if (!video || !streamUrl) {
            return;
        }

        var box = video.closest('[data-player-box]');
        var button = box ? box.querySelector('[data-player-button]') : null;
        var hlsInstance = null;
        var attached = false;

        function attach() {
            if (attached) {
                return;
            }

            attached = true;

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = streamUrl;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(streamUrl);
                hlsInstance.attachMedia(video);
            } else {
                video.src = streamUrl;
            }
        }

        function play() {
            attach();

            if (button) {
                button.classList.add('is-hidden');
            }

            var attempt = video.play();
            if (attempt && typeof attempt.catch === 'function') {
                attempt.catch(function () {
                    if (button) {
                        button.classList.remove('is-hidden');
                    }
                });
            }
        }

        if (button) {
            button.addEventListener('click', play);
        }

        video.addEventListener('click', function () {
            if (video.paused) {
                play();
            }
        });

        video.addEventListener('play', function () {
            if (button) {
                button.classList.add('is-hidden');
            }
        });

        video.addEventListener('ended', function () {
            if (button) {
                button.classList.remove('is-hidden');
            }
        });

        window.addEventListener('beforeunload', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    };
})();
