(function () {
    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function initMenu() {
        var button = qs('.menu-toggle');
        var menu = qs('#mobile-nav');
        if (!button || !menu) {
            return;
        }
        button.addEventListener('click', function () {
            var opened = menu.classList.toggle('is-open');
            button.setAttribute('aria-expanded', opened ? 'true' : 'false');
        });
    }

    function initHero() {
        var shell = qs('[data-hero]');
        if (!shell) {
            return;
        }
        var track = qs('.hero-track', shell);
        var slides = qsa('.hero-slide', shell);
        var dots = qsa('.slider-dot', shell);
        var current = 0;
        var timer = null;
        function go(index) {
            if (!track || slides.length === 0) {
                return;
            }
            current = (index + slides.length) % slides.length;
            track.style.transform = 'translateX(' + (-current * 100) + '%)';
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === current);
            });
        }
        function next() {
            go(current + 1);
        }
        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(next, 5200);
        }
        qsa('[data-slide]', shell).forEach(function (button) {
            button.addEventListener('click', function () {
                var direction = button.getAttribute('data-slide');
                go(direction === 'next' ? current + 1 : current - 1);
                restart();
            });
        });
        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                go(index);
                restart();
            });
        });
        go(0);
        restart();
    }

    function initFilters() {
        var blocks = qsa('[data-filter-scope]');
        blocks.forEach(function (block) {
            var input = qs('[data-filter-input]', block);
            var type = qs('[data-filter-type]', block);
            var region = qs('[data-filter-region]', block);
            var year = qs('[data-filter-year]', block);
            var cards = qsa('.movie-card', block);
            var empty = qs('.empty-state', block);
            function valueOf(el) {
                return el ? el.value.trim() : '';
            }
            function apply() {
                var query = valueOf(input).toLowerCase();
                var typeValue = valueOf(type);
                var regionValue = valueOf(region);
                var yearValue = valueOf(year);
                var visible = 0;
                cards.forEach(function (card) {
                    var text = (card.getAttribute('data-search') || '').toLowerCase();
                    var matchQuery = !query || text.indexOf(query) !== -1;
                    var matchType = !typeValue || (card.getAttribute('data-type') || '') === typeValue;
                    var matchRegion = !regionValue || (card.getAttribute('data-region') || '') === regionValue;
                    var matchYear = !yearValue || (card.getAttribute('data-year') || '') === yearValue;
                    var show = matchQuery && matchType && matchRegion && matchYear;
                    card.classList.toggle('hidden-card', !show);
                    if (show) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle('is-visible', visible === 0);
                }
            }
            [input, type, region, year].forEach(function (el) {
                if (el) {
                    el.addEventListener('input', apply);
                    el.addEventListener('change', apply);
                }
            });
            var params = new URLSearchParams(window.location.search);
            var q = params.get('q');
            if (q && input) {
                input.value = q;
            }
            apply();
        });
    }

    function initPlayers() {
        qsa('.player-card').forEach(function (card) {
            var video = qs('video', card);
            var button = qs('.play-toggle', card);
            var stream = card.getAttribute('data-stream');
            if (!video || !button || !stream) {
                return;
            }
            function bind() {
                if (video.getAttribute('data-ready') === '1') {
                    return;
                }
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = stream;
                } else if (window.Hls && window.Hls.isSupported()) {
                    var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                    hls.loadSource(stream);
                    hls.attachMedia(video);
                    video._hls = hls;
                } else {
                    video.src = stream;
                }
                video.setAttribute('data-ready', '1');
            }
            function play() {
                bind();
                card.classList.add('is-playing');
                var started = video.play();
                if (started && typeof started.catch === 'function') {
                    started.catch(function () {});
                }
            }
            button.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                play();
            });
            card.addEventListener('click', function (event) {
                if (event.target === video) {
                    return;
                }
                play();
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initMenu();
        initHero();
        initFilters();
        initPlayers();
    });
})();
