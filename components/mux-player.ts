import 'media-chrome';
import mux from "mux-embed";
import Hls from 'hls.js';

declare global {
  module JSX { // eslint-disable-line @typescript-eslint/no-namespace,@typescript-eslint/prefer-namespace-keyword
    interface IntrinsicElements {
      'media-controller': any; // eslint-disable-line @typescript-eslint/no-explicit-any
      'media-control-bar': any; // eslint-disable-line @typescript-eslint/no-explicit-any
      'media-play-button': any; // eslint-disable-line @typescript-eslint/no-explicit-any
      'media-mute-button': any; // eslint-disable-line @typescript-eslint/no-explicit-any
      'media-volume-range': any; // eslint-disable-line @typescript-eslint/no-explicit-any
      'media-progress-range': any; // eslint-disable-line @typescript-eslint/no-explicit-any
      'media-playback-rate-button': any; // eslint-disable-line @typescript-eslint/no-explicit-any
      'media-pip-button': any; // eslint-disable-line @typescript-eslint/no-explicit-any
      'media-fullscreen-button': any; // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }
}

const name = 'mux-player';
const template = document.createElement('template');

template.innerHTML = `
  <media-controller>
    <video slot="media" crossorigin>
      <track default kind="metadata" label="thumbnails"></track>
    </video>
    <media-control-bar>
      <media-play-button></media-play-button>
      <media-mute-button></media-mute-button>
      <media-volume-range></media-volume-range>
      <media-current-time-display></media-current-time-display>
      <media-time-range></media-time-range>
      <media-duration-display></media-duration-display>
      <media-playback-rate-button></media-playback-rate-button>
      <media-fullscreen-button></media-fullscreen-button>
    </media-control-bar>
  </media-controller>
`;

class MuxPlayer extends HTMLElement {
  constructor () {
    super();
    console.log('debug MuxPlayer 5', this.getAttribute('playback-id'));

    this.attachShadow({ mode: 'open' });
    if (this.shadowRoot) {
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }

  connectedCallback (): void {
    this.setMediaSlot();
  }

  attributeChangedCallback (name: string|null, oldValue: string|null, newValue: string|null):void {
    switch (name) {
      case 'playback-id':
        this.setMediaSlot();
        break;
      default:
        console.warn('Not handling attribute changed', name, oldValue, newValue);
    }
  }

  get videoEl ():HTMLVideoElement|null {
    return this.shadowRoot?.querySelector('video') || null;
  }

  get trackEl ():HTMLTrackElement|null {
    return this.shadowRoot?.querySelector('track') || null;
  }

  get playbackUrl ():string|null {
    return this.getAttribute('playback-id') && `https://stream.mux.com/${this.getAttribute('playback-id')}.m3u8`;
  }

  get storyboardUrl ():string|null {
    return this.getAttribute('playback-id') && `https://image.mux.com/${this.getAttribute('playback-id')}/storyboard.vtt`;
  }

  static get observedAttributes():string[] {
    return ['playback-id'];
  }

  get shouldUseNativeHls ():boolean {
    return !!this.videoEl?.canPlayType('application/vnd.apple.mpegurl');
  }

  setMediaSlot ():void {
    console.log('debug setMediaSlot');
    if (!(this.playbackUrl && this.videoEl)) {
      return;
    }

    let hls;

    if (this.shouldUseNativeHls) {
      this.videoEl.src = this.playbackUrl;
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(this.playbackUrl);
      hls.attachMedia(this.videoEl);
    } else {
      console.error('Cannot to Hls playback in this browser because it does not support MSE');
    }

    mux.monitor(this.videoEl, {
      debug: true,
      hlsjs: hls,
      Hls: hls ? Hls : null,
      data: {
        env_key: this.getAttribute('env-key'),
        player_name: 'Mux player', 
        player_init_time: Date.now() // ex: 1451606400000
      }
    });

    const trackEl = this.trackEl;
    if (trackEl && this.storyboardUrl) {
      trackEl.src = this.storyboardUrl;
      trackEl.track.mode = 'hidden';
    }
  }
}

if (!window.customElements.get(name)) {
  window.customElements.define(name, MuxPlayer);
}

export default MuxPlayer;
