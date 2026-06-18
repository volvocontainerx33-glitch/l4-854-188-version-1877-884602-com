(function () {
  function init(root) {
    var video = root.querySelector('video');
    var overlay = root.querySelector('[data-player-overlay]');
    var button = root.querySelector('[data-play-button]');

    if (!video || !overlay || !button) {
      return;
    }

    var streamUrl = video.getAttribute('data-stream');
    var hls = null;
    var prepared = false;

    function prepare() {
      if (prepared || !streamUrl) {
        return;
      }

      prepared = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
      } else {
        video.src = streamUrl;
      }
    }

    function play() {
      prepare();
      overlay.hidden = true;
      video.controls = true;
      var promise = video.play();

      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          overlay.hidden = false;
        });
      }
    }

    overlay.addEventListener('click', play);
    button.addEventListener('click', play);
    video.addEventListener('play', function () {
      overlay.hidden = true;
    });
    video.addEventListener('pause', function () {
      if (!video.currentTime) {
        overlay.hidden = false;
      }
    });

    window.addEventListener('beforeunload', function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.slice.call(document.querySelectorAll('[data-player-root]')).forEach(init);
  });
})();
