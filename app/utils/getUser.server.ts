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
      track: true,
    },
  });
};
