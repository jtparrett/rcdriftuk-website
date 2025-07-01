import { prisma } from "./prisma.server";

export type GetUsers = Awaited<ReturnType<typeof getUsers>>;

export const getUsers = async () => {
  const users = await prisma.users.findMany({
    where: {
      firstName: {
        not: "BYE",
      },
    },
    select: {
      driverId: true,
      firstName: true,
      lastName: true,
    },
    orderBy: [
      {
        firstName: "asc",
      },
      {
        lastName: "asc",
      },
    ],
  });

  return users;
};
