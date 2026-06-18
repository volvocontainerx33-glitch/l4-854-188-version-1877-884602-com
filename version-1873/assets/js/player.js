(function () {
  var player = document.querySelector('[data-player]');

  if (!player) {
    return;
  }

  var video = player.querySelector('video');
  var playButton = player.querySelector('[data-play]');
  var source = video ? video.getAttribute('data-src') : '';
  var attached = false;

  var attachSource = function () {
    if (!video || !source || attached) {
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      video._hlsInstance = hls;
    } else {
      video.src = source;
    }

    attached = true;
  };

  var startPlayback = function () {
    if (!video) {
      return;
    }

    attachSource();
    player.classList.add('is-ready');
    video.setAttribute('controls', 'controls');

    var playPromise = video.play();

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        player.classList.remove('is-ready');
      });
    }
  };

  if (playButton) {
    playButton.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      startPlayback();
    });
  }

  player.addEventListener('click', function (event) {
    if (event.target === video || event.target.classList.contains('player-overlay')) {
      startPlayback();
    }
  });

  if (video) {
    video.addEventListener('play', function () {
      player.classList.add('is-playing');
    });

    video.addEventListener('pause', function () {
      player.classList.remove('is-playing');
    });

    video.addEventListener('ended', function () {
      player.classList.remove('is-playing');
    });
  }
}());
