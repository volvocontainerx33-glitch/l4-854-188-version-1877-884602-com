(function () {
    function playVideo(video) {
        var action = video.play();
        if (action && typeof action.catch === 'function') {
            action.catch(function () {});
        }
    }

    function init(videoId, overlayId, buttonId, sourceUrl) {
        var video = document.getElementById(videoId);
        var overlay = document.getElementById(overlayId);
        var button = document.getElementById(buttonId);
        var ready = false;
        var hlsInstance = null;

        if (!video || !overlay || !button || !sourceUrl) {
            return;
        }

        function attachSource() {
            if (ready) {
                playVideo(video);
                return;
            }
            ready = true;
            overlay.classList.add('is-hidden');
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = sourceUrl;
                playVideo(video);
                return;
            }
            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({ enableWorker: true });
                hlsInstance.loadSource(sourceUrl);
                hlsInstance.attachMedia(video);
                hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                    playVideo(video);
                });
                hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                    if (data && data.fatal && hlsInstance) {
                        hlsInstance.destroy();
                        hlsInstance = null;
                        video.src = sourceUrl;
                    }
                });
                return;
            }
            video.src = sourceUrl;
            playVideo(video);
        }

        overlay.addEventListener('click', attachSource);
        button.addEventListener('click', function (event) {
            event.stopPropagation();
            attachSource();
        });
        video.addEventListener('click', function () {
            if (!ready) {
                attachSource();
            }
        });
    }

    window.MoviePlayer = {
        init: init
    };
})();
