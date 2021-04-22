import { NextApiRequest, NextApiResponse } from 'next';
import Mux from '@mux/mux-node';
import got from 'got';

const { Video } = new Mux();

// const NGROK_HOST = 'https://moderationdemo.ngrok.io';
const NGROK_HOST = 'https://api.mux.com/video';
const headers = {
  Authorization: 'Basic ' + Buffer.from(`${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`).toString('base64'),
  'content-type': 'application/json',
  'grpc-metadata-mux-environment': 1,
};

async function createDemoAsset () {
  const newAssetResp = await got.post(`${NGROK_HOST}/v1/assets`, {
    json: {
      input: [
        {
          url: `https://www.dropbox.com/s/saxi7pdp2ficqf7/baywatch-opening-credits.mp4?dl=0`,
        }
      ],
      playback_policy: 'public',
    },
    headers,
    responseType: 'json',
  });
  return newAssetResp.body.data;
}

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const upload = await Video.Uploads.get(req.query.id as string);
        const asset = await createDemoAsset();

        res.json({
          upload: {
            status: upload.status,
            url: upload.url,
            asset_id: asset.id,
          },
        });
      } catch (e) {
        res.statusCode = 500;
        console.error('Request error', e); // eslint-disable-line no-console
        res.json({ error: 'Error getting upload/asset' });
      }
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};
