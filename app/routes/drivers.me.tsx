import { redirect, type LoaderFunctionArgs } from "react-router";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect("/sign-in");
  }

  const user = await prisma.users.findFirst({
    where: {
      id: userId,
    },
    select: {
      driverId: true,
    },
  });

  notFoundInvariant(user, "User not found");

  throw redirect(`/drivers/${user.driverId}`);
};
