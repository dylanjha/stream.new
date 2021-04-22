import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import Button from '../../components/button';
import FullpageLoader from '../../components/fullpage-loader';

type Props = null;

const DisablePlaybackId: React.FC<Props> = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { playback_id: playbackId, slack_moderator_password: slackModeratorPassword } = router.query;

  const disablePlaybackId = async () => {
    try {
      setIsLoading(true);
      const resp = await fetch(`/api/playback-ids/${playbackId}/disable`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slack_moderator_password: slackModeratorPassword,
        }),
      });
      if (!resp.ok) {
        setErrorMessage(`Error disabling playbackId: ${resp.status}`);
        return;
      }
      setIsLoading(false);
      setIsDisabled(true);
    } catch (e) {
      console.error('Error disabling playbackId', e); // eslint-disable-line no-console
      setErrorMessage('Error disabling playbackId');
    }
  };

  if (errorMessage) {
    return (
      <Layout>
        <div><h1>{errorMessage}</h1></div>
      </Layout>
    );
  }

  return (
    <Layout>
      {
        isLoading
          ? <FullpageLoader />
          : (
            <div className="wrapper">
              { isDisabled ? <div>Playback ID {playbackId} is disabled</div> : <Button onClick={disablePlaybackId}>Disable playback id {playbackId}</Button> }
              <style jsx>{`
            .wrapper {
              flex-grow: 1;
              display: flex;
              align-items: center;
            }
          `}
              </style>
            </div>
          )
      }
    </Layout>
  );
};

export default DisablePlaybackId;
