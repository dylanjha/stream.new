/* globals Image */
import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import logger from '../lib/logger';
import Router from 'next/router';
import nouislider from 'nouislider';
import 'nouislider/distribute/nouislider.css';
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

function noop () {
}

const VideoClipper: React.FC<Props> = ({ playbackId, poster, onLoaded, onError }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sliderRef = useRef<HTMLElement | null>(null);
  const [isVertical, setIsVertical] = useState<boolean | null>();
  const [errorMessage, setErrorMessage] = useState('');
  const [isCreatingClip, setIsCreatingClip] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const prevStartTime = useRef<number | null>(null);
  const prevEndTime = useRef<number | null>(null);
  const [duration, setDuration] = useState<number | null>();

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

  const loadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
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
      video.addEventListener('loadedmetadata', loadedMetadata);

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

  /*
   * When the selected start/end times change, update the playhead of the player
   */
  useEffect(() => {
    if (startTime !== prevStartTime.current) {
      if (videoRef.current) {
        videoRef.current.currentTime = (startTime || 0);
      }
      prevStartTime.current = startTime;
    }
    if (endTime !== prevEndTime.current) {
      if (videoRef.current) {
        videoRef.current.currentTime = (endTime || 0);
      }
      prevEndTime.current = endTime;
    }

    console.log('debug new', startTime, endTime);
  }, [startTime, endTime]);

  useEffect(() => {
    if (!(sliderRef.current && duration)) {
      return noop;
    }

    /*
     * Pick some sensible start/end times: 25% - 50% of the video
     * is a good place to start
     */
    const start = (duration / 4);
    const end = (duration / 2);
    nouislider.create(sliderRef.current, {
      start: [start, end],
      connect: true,
      range: {
        min: 0,
        max: duration,
      }
    });

    sliderRef.current.noUiSlider.on('update', (values) => {
      if (values[0]) {
        setStartTime(+values[0]);
      }
      if (values[1]) {
        setEndTime(+values[1]);
      }
    });

    return () => {
      sliderRef.current.noUiSlider.destroy();
    };
  }, [duration, sliderRef]);

  return (
    <>
      <div className='video-container'>
        <video ref={videoRef} poster={poster} controls playsInline />
        <div className="times">
          <div className="scrubber"></div>
          <div ref={sliderRef} />
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
