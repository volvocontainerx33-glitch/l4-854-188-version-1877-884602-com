(function () {
    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

    function setupMenu() {
        var toggle = document.querySelector("[data-menu-toggle]");
        var nav = document.querySelector("[data-mobile-nav]");
        if (!toggle || !nav) {
            return;
        }
        toggle.addEventListener("click", function () {
            nav.classList.toggle("is-open");
        });
    }

    function setupHero() {
        var root = document.querySelector("[data-hero]");
        if (!root) {
            return;
        }
        var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
        if (!slides.length) {
            return;
        }
        var index = 0;
        var timer = null;

        function show(next) {
            index = (next + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("is-active", i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("is-active", i === index);
            });
        }

        function play() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                var next = Number(dot.getAttribute("data-hero-dot") || 0);
                show(next);
                play();
            });
        });

        root.addEventListener("mouseenter", function () {
            window.clearInterval(timer);
        });
        root.addEventListener("mouseleave", play);
        show(0);
        play();
    }

    function setupFilters() {
        var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
        panels.forEach(function (panel) {
            var list = panel.parentElement ? panel.parentElement.querySelector("[data-card-list]") : null;
            if (!list) {
                list = document;
            }
            var cards = Array.prototype.slice.call(list.querySelectorAll("[data-card]"));
            var input = panel.querySelector("[data-filter-input]");
            var region = panel.querySelector("[data-filter-region]");
            var type = panel.querySelector("[data-filter-type]");
            var year = panel.querySelector("[data-filter-year]");

            fillOptions(region, cards, "region");
            fillOptions(type, cards, "type");
            fillOptions(year, cards, "year", true);

            function apply() {
                var keyword = input ? input.value.trim().toLowerCase() : "";
                var selectedRegion = region ? region.value : "";
                var selectedType = type ? type.value : "";
                var selectedYear = year ? year.value : "";
                cards.forEach(function (card) {
                    var text = card.getAttribute("data-search-text") || "";
                    var ok = true;
                    if (keyword && text.indexOf(keyword) === -1) {
                        ok = false;
                    }
                    if (selectedRegion && card.getAttribute("data-region") !== selectedRegion) {
                        ok = false;
                    }
                    if (selectedType && card.getAttribute("data-type") !== selectedType) {
                        ok = false;
                    }
                    if (selectedYear && card.getAttribute("data-year") !== selectedYear) {
                        ok = false;
                    }
                    card.classList.toggle("is-hidden", !ok);
                });
            }

            [input, region, type, year].forEach(function (el) {
                if (el) {
                    el.addEventListener("input", apply);
                    el.addEventListener("change", apply);
                }
            });

            var params = new URLSearchParams(window.location.search);
            var q = params.get("q");
            if (q && input) {
                input.value = q;
                apply();
            }
        });
    }

    function fillOptions(select, cards, key, reverse) {
        if (!select) {
            return;
        }
        var values = [];
        cards.forEach(function (card) {
            var value = card.getAttribute("data-" + key) || "";
            if (value && values.indexOf(value) === -1) {
                values.push(value);
            }
        });
        values.sort(function (a, b) {
            if (reverse) {
                return String(b).localeCompare(String(a), "zh-Hans-CN");
            }
            return String(a).localeCompare(String(b), "zh-Hans-CN");
        });
        values.forEach(function (value) {
            var option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
    }

    function setupPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));
        players.forEach(function (player) {
            var video = player.querySelector("video");
            var button = player.querySelector("[data-play-button]");
            var stream = player.getAttribute("data-stream");
            var instance = null;
            if (!video || !stream) {
                return;
            }

            function attach() {
                if (player.getAttribute("data-ready") === "yes") {
                    return;
                }
                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = stream;
                } else if (window.Hls && window.Hls.isSupported()) {
                    instance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    instance.loadSource(stream);
                    instance.attachMedia(video);
                } else {
                    video.src = stream;
                }
                player.setAttribute("data-ready", "yes");
            }

            function start() {
                attach();
                player.classList.add("is-playing");
                var playPromise = video.play();
                if (playPromise && typeof playPromise.catch === "function") {
                    playPromise.catch(function () {});
                }
            }

            if (button) {
                button.addEventListener("click", start);
            }
            player.addEventListener("click", function (event) {
                if (event.target === video) {
                    return;
                }
                start();
            });
            video.addEventListener("play", function () {
                player.classList.add("is-playing");
            });
            video.addEventListener("pause", function () {
                if (!video.seeking && video.currentTime > 0) {
                    player.classList.remove("is-playing");
                }
            });
            window.addEventListener("beforeunload", function () {
                if (instance) {
                    instance.destroy();
                }
            });
        });
    }

    ready(function () {
        setupMenu();
        setupHero();
        setupFilters();
        setupPlayers();
    });
})();
