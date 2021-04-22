import { NextApiRequest, NextApiResponse } from 'next';
import Mux from '@mux/mux-node';
import got from 'got';
import { blockPlaybackId } from '../../../lib/video-actions';

const { Video } = new Mux();

const NGROK_HOST = 'https://moderationdemo.ngrok.io';
// const NGROK_HOST = 'https://api.mux.com/video';

const headers = {
  // Authorization: 'Basic ' + Buffer.from(`${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`).toString('base64'),
  'content-type': 'application/json',
  'grpc-metadata-mux-environment': 1,
};

async function getAsset (assetId: string) {
  const assetResp = await got.get(`${NGROK_HOST}/v1/assets/${assetId}`, { headers, responseType: 'json' });
  return assetResp.body?.data
}

async function requestModerationInfo (asset) {
  // asset.moderation_info = { status: "ready" };
  // return asset;
   const assetResp = await got.put(`${NGROK_HOST}/v1/assets/${asset.id}/moderation`, {
     headers,
     responseType: 'json',
     json: {moderation: 'standard'}
   });
   return assetResp.body.data;
}

async function checkIfThisIsTooHotToStream (asset) {
  // return;
  const playbackId = asset.playback_ids[0].id;

  console.log('found moderation info for asset:', asset.id, asset.moderation_info);
  if (asset.moderation_info.adult >= 3 || asset.moderation_info.racy >= 4) {
    console.log('This asset is too hot for the internet', asset.id);
    await blockPlaybackId({ playbackId });
  }
}

export default async function assetHandler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const assetId = (req.query.id as string);
        let asset = await getAsset(assetId);
        if (!(asset.playback_ids && asset.playback_ids[0])) {
          throw new Error('Error getting playback_id from asset');
        }
        /*
         * Asset is ready and doesn't have moderation info, so let's request it
         */
        if (asset.status === 'ready' && !asset.moderation_info) {
          console.log('No moderation_info for asset, requesting...', assetId);
          asset = await requestModerationInfo(asset);
        }
        /*
         * If moderation_info is 'ready', let's check if it's TOO HOT
         *
         * If this _is_ too hot, then the playback ID will be flagged in our database and we
         * are all good
         *
         */
        if (asset.moderation_info && asset.moderation_info.status === 'ready') {
          console.log("moderation_info for asset is ready lets see if it's too spicy...", assetId);
          await checkIfThisIsTooHotToStream(asset);
        }
        res.json({
          asset: {
            id: asset.id,
            /*
             * If the asset has moderation_info, we care about that moderation info 'status'
             *
             * If it does not, then all we care about is the asset status
             */
            status: (asset.status === 'ready' && asset.moderation_info.status === 'ready') ? 'ready' : 'preparing',
            errors: asset.errors,
            playback_id: asset.playback_ids[0].id,
          },
        });
      } catch (e) {
        res.statusCode = 500;
        console.error('Request error', e); // eslint-disable-line no-console
        res.json({ error: 'Error getting upload/asset' });
      }
      break;
    case 'DELETE':
      if (
        !process.env.SLACK_MODERATOR_PASSWORD
        || (req.body.slack_moderator_password !== process.env.SLACK_MODERATOR_PASSWORD)
      ) {
        res.status(401).end('Unauthorized');
        return;
      }

      try {
        await Video.Assets.del(req.query.id as string);
        res.status(200).end(`Deleted ${req.query.id}`);
      } catch (e) {
        res.statusCode = 500;
        console.error('Request error', e); // eslint-disable-line no-console
        res.end('Error deleting asset');
      }
      break;
    default:
      res.setHeader('Allow', ['GET', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
