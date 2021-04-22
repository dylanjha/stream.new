import { NextApiRequest, NextApiResponse } from 'next';
import { blockPlaybackId } from '../../../../lib/video-actions';

export default async function assetHandler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { method } = req;

  switch (method) {
    case 'PUT':
      try {
        const playbackId = (req.query.id as string);
        await blockPlaybackId({ playbackId });
        res.json({
          message: 'blocked',
          playbackId,
        });
      } catch (e) {
        console.error('Request error blockPlaybackId', e); // eslint-disable-line no-console
        res.statusCode = 500;
        res.json({ error: 'Error getting upload/asset' });
      }
      break;
    default:
      res.setHeader('Allow', ['PUT']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
