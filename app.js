'use strict';

class MSE {
    constructor(video, file) {
        this.getDescription(video, file);
        this.segmentIndex = 0;
        this.mediaAppended = false;
    }

    getDescription(video, file) {
        const xhr = new XMLHttpRequest();

        xhr.open('GET', file, true);
        xhr.responseType = 'document';

        xhr.onload = () => {
            this.mpd = xhr.response;

            const representation = this.mpd.querySelector('Representation');
            const mimeType       = representation.getAttribute('mimeType');
            const codecs         = representation.getAttribute('codecs');

            this.type = `${mimeType}; codecs="${codecs}"`;

            this.initVideo(video);
        };

        xhr.send(null);
    }

    initVideo(video) {
        this.mediaSource = new MediaSource();
        this.mediaSource.addEventListener('sourceopen', this.initSourceBuffer.bind(this), false);

        video.src = window.URL.createObjectURL(this.mediaSource);

        // if ('srcObject' in video) {
        //     video.srcObject = this.mediaSource;
        // } else {
        //     video.src = window.URL.createObjectURL(this.mediaSource);
        // }
    }

    initSourceBuffer() {
        this.sourceBuffer = this.mediaSource.addSourceBuffer(this.type);
        this.sourceBuffer.addEventListener('updateend', this.appendMediaSegment.bind(this), false);
        this.appendInitSegment();
    }

    appendSegment(event) {
        this.sourceBuffer.appendBuffer(event.currentTarget.response);

        if (this.mediaAppended) {
            this.sourceBuffer.removeEventListener('updateend', this.appendMediaSegment.bind(this), false);
        }
    }

    appendMediaSegment() {
        const xhr = new XMLHttpRequest();

        const segmentURL = this.mpd.querySelectorAll('SegmentURL')[this.segmentIndex++];

        if (!segmentURL) {
            this.mediaAppended = true;
            return;
        }

        xhr.open('GET', segmentURL.getAttribute('media'), true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = this.appendSegment.bind(this);
        xhr.send(null);
    }

    appendInitSegment() {
        const xhr = new XMLHttpRequest();

        xhr.open('GET', this.mpd.querySelector('Initialization').getAttribute('sourceURL'), true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = this.appendSegment.bind(this);
        xhr.send(null);
    }
}

const mse = new MSE(document.querySelector('video'), 'output.mpd');

console.dir(mse);
