import { prisma } from "./prisma.server";

export type GetUser = Awaited<ReturnType<typeof getUser>>;

export const getUser = async (userId: string) => {
  return prisma.users.findFirst({
    where: {
      id: userId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      driverId: true,
      image: true,
      totalBattles: true,
      Tracks: {
        select: {
          track: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
            },
          },
        },
      },
    },
  });
};
