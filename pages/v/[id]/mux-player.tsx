import { useState, useRef, useEffect } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { useRouter } from 'next/router';
import FullpageLoader from '../../../components/fullpage-loader';
import Layout from '../../../components/layout';
import { HOST_URL } from '../../../constants';
// import logger from '../../../lib/logger';

type Params = {
  id: string;
}

export type Props = {
  playbackId: string,
  shareUrl: string,
  poster: string
};

declare global {
  module JSX { // eslint-disable-line @typescript-eslint/no-namespace,@typescript-eslint/prefer-namespace-keyword
    interface IntrinsicElements {
      'mux-player': any; // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }
}

export const getStaticProps: GetStaticProps = async (context)  => {
  const { params } = context;
  const { id: playbackId } = (params as Params);
  const poster = `https://image.mux.com/${playbackId}/thumbnail.png`;
  const shareUrl = `${HOST_URL}/v/${playbackId}`;

  return { props: { playbackId, shareUrl, poster } };
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  };
};

const META_TITLE = "View this video created on stream.new";
const Playback: React.FC<Props> = ({ playbackId, poster }) => {
  const [isLoaded, setIsLoaded] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [openReport, setOpenReport] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    import("../../../components/mux-player");
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  if (router.isFallback) {
    return (
      <Layout
        metaTitle="View this video created on stream.new"
        image={poster}
        centered
        darkMode
      >
        <FullpageLoader text="Loading player..." />;
      </Layout>
    );
  }

  /*
  const onError = (evt: ErrorEvent) => {
    setErrorMessage('This video does not exist');
    setIsLoaded(false);
    logger.error('Error', evt);
  };
  */

  const showLoading = (!isLoaded && !errorMessage);

  /*
  const startTime = router.query?.time && parseFloat(router.query.time as string) || 0;
  */

  return (
    <Layout
      metaTitle={META_TITLE}
      image={poster}
      centered={showLoading}
      darkMode
    >
      {errorMessage && <h1 className="error-message">{errorMessage}</h1>}
      {showLoading && <FullpageLoader text="Loading player" />}
      <div className="wrapper">


        <mux-player playback-id={playbackId} env-key="cqtqt2jfbq235huvso0djbn56"></mux-player>


      </div>
      <style jsx>{`
        .error-message {
          color: #ccc;
        }
        .wrapper {
          display: ${isLoaded ? 'flex' : 'none'};
          flex-direction: column;
          flex-grow: 1;
          align-items: center;
          justify-content: center;
        }
      `}
      </style>
    </Layout>
  );
};

export default Playback;
