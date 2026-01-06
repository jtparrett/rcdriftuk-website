import { prisma } from "./prisma.server";

export type GetUserOwnedTrackBySlug = Awaited<
  ReturnType<typeof getUserOwnedTrackBySlug>
>;

export const getUserOwnedTrackBySlug = async (slug: string, userId: string) => {
  const track = await prisma.tracks.findFirst({
    where: {
      slug,
      Owners: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      address: true,
      image: true,
      cover: true,
      description: true,
      status: true,
      types: true,
      url: true,
      lat: true,
      lng: true,
      leaderboardId: true,
      region: true,
    },
  });

  if (!track) {
    throw new Response("Track not found", {
      status: 404,
    });
  }

  return track;
};
