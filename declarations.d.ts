interface Window {
  webkitAudioContext: typeof AudioContext
}

interface MediaDevices {
  getDisplayMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>;
}

interface MediaTrackConstraintSet {
  displaySurface?: ConstrainDOMString;
  logicalSurface?: ConstrainBoolean;
}

declare module 'mux-embed' {
  export function monitor (video: HTMLVideoElement, options: Record<string, any>) // eslint-disable-line @typescript-eslint/no-explicit-any
}

declare module 'media-chrome/dist/extras/media-clip-selector' {
  export default ComponentType;
}

type NoProps = Record<never, never>
