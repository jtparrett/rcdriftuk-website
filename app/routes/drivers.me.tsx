import { redirect, type LoaderFunctionArgs } from "react-router";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId);

  const user = await prisma.users.findFirst({
    where: {
      id: userId,
    },
    select: {
      driverId: true,
    },
  });

  notFoundInvariant(user);

  throw redirect(`/drivers/${user.driverId}`);
};
