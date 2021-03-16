/* globals Image */
import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import logger from '../lib/logger';
import Router from 'next/router';
import { breakpoints } from '../style-vars';

type Props = {
  playbackId: string
  poster: string
  onLoaded: () => void
  onError: (error: ErrorEvent) => void
};

type SizedEvent = {
  target: {
    width: number
    height: number
  }
};

const VideoClipper: React.FC<Props> = ({ playbackId, poster, onLoaded, onError }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVertical, setIsVertical] = useState<boolean | null>();
  const [errorMessage, setErrorMessage] = useState('');
  const [isCreatingClip, setIsCreatingClip] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(10);
  const [endTime, setEndTime] = useState<number | null>(20);

  const videoError = (event: ErrorEvent) => onError(event);

  const onImageLoad = (event: SizedEvent) => {
    const [w, h] = [event.target.width, event.target.height];
    if (w && h) {
      setIsVertical((w / h) < 1);
      onLoaded();
    } else {
      onLoaded();
      console.error('Error getting img dimensions', event); // eslint-disable-line no-console
    }
  };

  const createClip = async () => {
    try {
      setErrorMessage('');
      setIsCreatingClip(true);
      await fetch('/api/clips', {
        method: 'POST',
        body: JSON.stringify({ playbackId, startTime, endTime }),
        headers: { 'content-type': 'application/json' },
      })
        .then((res) => res.json())
        .then(({ id }) => {
          setIsCreatingClip(false);
          Router.push({
            pathname: `/assets/${id}`,
          });
        });
    } catch (e) {
      console.error('Error in createUpload', e); // eslint-disable-line no-console
      setIsCreatingClip(false);
      setErrorMessage('Error creating this clip');
      return Promise.reject(e);
    }
  };

  /*
   * See comment above -- we're loading the poster image just so we can grab the dimensions
   * which determines styles for the player
   */
  useEffect(() => {
    const img = new Image();
    img.onload = (evt) => onImageLoad((evt as unknown) as SizedEvent);
    img.src = poster;
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const src = `https://stream.mux.com/${playbackId}.m3u8`;
    let hls: Hls | null;
    hls = null;
    if (video) {
      video.addEventListener('error', videoError);

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // This will run in safari, where HLS is supported natively
        video.src = src;
      } else if (Hls.isSupported()) {
        // This will run in all other modern browsers
        hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, function (event, data) {
          if (data.fatal) {
            logger.error('hls.js fatal error');
            videoError(new ErrorEvent('HLS.js fatal error'));
          }
        });
      } else {
        console.error( // eslint-disable-line no-console
          'This is an old browser that does not support MSE https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API',
        );
      }
    }

    return () => {
      if (video) {
        video.removeEventListener('error', videoError);
      }
      if (hls) {
        hls.destroy();
      }
    };
  }, [playbackId, videoRef]);

  return (
    <>
      <div className='video-container'>
        <video ref={videoRef} poster={poster} controls playsInline />
        <div className="times">
          <div className="scrubber"></div>
          <div>Start: {startTime} <button onClick={() => setStartTime(Math.round(videoRef.current?.currentTime || 0))}>Set start</button></div>
          <div>End: {endTime} <button onClick={() => setEndTime(Math.round(videoRef.current?.currentTime || 0))}>Set end</button></div>
          {isCreatingClip ? <div>Creating clip...</div> : <button onClick={createClip}>create clip</button>}
          {errorMessage && <div>Error: {errorMessage}</div>}
        </div>
      </div>
      <style jsx>{`
        .times {
          color: white;
        }
        .scrubber {
          height: 6px;
          width: 100%;
          background-color: gray;
        }
        video {
          display: block;
          max-width: 100%;
          max-height: 50vh;
          cursor: pointer;
        }
        @media only screen and (min-width: ${breakpoints.md}px) {
          video {           
            width: ${isVertical ? 'auto' : '1000px'};
            height: ${isVertical ? '600px' : 'auto'}; 
            max-height: 70vh;
            min-width: 30rem;
          }
        }
        @media only screen and (max-width: ${breakpoints.md}px) {
          video: {
            width: 100%;
            height: 100%;
          }
        }
      `}
      </style>
    </>
  );
};

export default VideoClipper;
