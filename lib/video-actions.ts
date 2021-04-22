import prisma from './prisma-client';

type BlockParams = {
  playbackId: string,
}

export async function blockPlaybackId ({ playbackId }: BlockParams): Promise<string> {
  const updates= { disabledByModeration: true };

  try {
    await prisma.video.update({
      where: { playbackId },
      data: updates,
    });
  } catch (e) {
    /*
     * This specific code means that an update was attempted, but no records
     * matched the query.
     *
     * For our case, if no records match the update then we want to create it
     *
     * https://www.prisma.io/docs/reference/api-reference/error-reference#error-codes
     */
    if (e.code === 'P2025') {
      await prisma.video.create({
        data: { playbackId, ...updates },
      });
    } else {
      throw e;
    }
  }
  return playbackId;
}
