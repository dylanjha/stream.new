import { NextApiRequest, NextApiResponse } from 'next';
import Mux from '@mux/mux-node';

async function createAssetClip ({ playbackId, startTime, endTime }: {playbackId: string, startTime: number, endTime: number}) {
  const { Video } = new Mux();
  const playback = await Video.PlaybackIds.get(playbackId);
  if (playback.object.type === 'asset') {
    const newAsset = await Video.Assets.create({
      playback_policy: 'public',
      input: [
        {
          url: `mux://assets/${playback.object.id}`,
          start_time: startTime,
          end_time: endTime,
        }
      ],
    });
    return newAsset;
  } else {
    throw new Error(`Expected an asset playback ID, can't clip this`);
  }
}

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const { method, body } = req;
  const { playbackId, startTime, endTime } = body;
  let asset;

  switch (method) {
    case 'POST':
      if (!playbackId) {
        // format this error the way the frontend expects
        res.json({ errors: ['Need a playbackId']});
        return;
      }
      try {
        asset = await createAssetClip({ playbackId, startTime, endTime });
        res.json({ id: asset.id });
      } catch (e) {
        if (e.response && e.response.body) {
          res.status(400).json(e.response.body);
          return;
        }
        // format this error the way the frontend expects
        res.status(400).json({ error: '' });
      }
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};
