(function () {
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 18);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (menuButton && mobileNav && header) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
      header.classList.toggle('menu-open');
    });
  }

  document.querySelectorAll('[data-global-search]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      const input = form.querySelector('input[name="q"]');
      if (!input || !input.value.trim()) {
        event.preventDefault();
        window.location.href = form.getAttribute('action') || 'search.html';
      }
    });
  });

  document.querySelectorAll('[data-hero-slider]').forEach(function (slider) {
    const track = slider.querySelector('[data-hero-track]');
    const slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
    const prev = slider.querySelector('[data-hero-prev]');
    const next = slider.querySelector('[data-hero-next]');
    const dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
    let current = 0;

    function go(index) {
      if (!track || slides.length === 0) return;
      current = (index + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-current * 100) + '%)';
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    if (prev) prev.addEventListener('click', function () { go(current - 1); });
    if (next) next.addEventListener('click', function () { go(current + 1); });
    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () { go(index); });
    });

    if (slides.length > 1) {
      window.setInterval(function () { go(current + 1); }, 5200);
    }

    go(0);
  });

  document.querySelectorAll('[data-search-page]').forEach(function (panel) {
    const keyword = panel.querySelector('[data-search-input]');
    const typeFilter = panel.querySelector('[data-filter-type]');
    const yearFilter = panel.querySelector('[data-filter-year]');
    const regionFilter = panel.querySelector('[data-filter-region]');
    const status = panel.querySelector('[data-filter-status]');
    const cards = Array.prototype.slice.call(panel.querySelectorAll('.movie-card'));
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('q') || '';

    if (keyword && initial) {
      keyword.value = initial;
    }

    function yearMatch(value, year) {
      if (!value) return true;
      const n = Number(year);
      if (value === '2020') return n >= 2020;
      if (value === '2010') return n >= 2010 && n < 2020;
      if (value === '2000') return n >= 2000 && n < 2010;
      if (value === 'old') return n < 2000;
      return true;
    }

    function regionMatch(value, region) {
      if (!value) return true;
      const common = ['日本', '韩国', '中国大陆', '中国香港', '中国台湾', '美国', '法国', '德国'];
      if (value === '其他') {
        return !common.some(function (item) { return region.indexOf(item) >= 0; });
      }
      return region.indexOf(value) >= 0;
    }

    function apply() {
      const text = keyword ? keyword.value.trim().toLowerCase() : '';
      const type = typeFilter ? typeFilter.value : '';
      const year = yearFilter ? yearFilter.value : '';
      const region = regionFilter ? regionFilter.value : '';
      let visible = false;

      cards.forEach(function (card) {
        const haystack = [
          card.dataset.title || '',
          card.dataset.region || '',
          card.dataset.type || '',
          card.dataset.tags || '',
          card.dataset.category || ''
        ].join(' ').toLowerCase();
        let ok = !text || haystack.indexOf(text) >= 0;
        ok = ok && (!type || (card.dataset.type || '').indexOf(type) >= 0);
        ok = ok && yearMatch(year, card.dataset.year || '0');
        ok = ok && regionMatch(region, card.dataset.region || '');
        card.style.display = ok ? '' : 'none';
        if (ok) visible = true;
      });

      if (status) {
        status.textContent = visible ? '筛选结果已更新' : '暂无匹配影片';
      }
    }

    [keyword, typeFilter, yearFilter, regionFilter].forEach(function (control) {
      if (control) control.addEventListener('input', apply);
      if (control) control.addEventListener('change', apply);
    });

    apply();
  });

  document.querySelectorAll('[data-stream]').forEach(function (box) {
    const video = box.querySelector('video');
    const button = box.querySelector('[data-play]');
    const source = box.dataset.stream;
    let started = false;
    let hlsInstance = null;

    function attachSource() {
      if (!video || !source || started) return;
      started = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({ enableWorker: true });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
      } else {
        video.src = source;
      }

      if (button) button.classList.add('hidden');
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {});
      }
    }

    if (button) {
      button.addEventListener('click', attachSource);
    }

    if (video) {
      video.addEventListener('click', function () {
        if (!started) attachSource();
      });
      window.addEventListener('pagehide', function () {
        if (hlsInstance) hlsInstance.destroy();
      });
    }
  });
})();
