import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);

  invariant(userId);

  const formData = await args.request.formData();
  const name = z.string().parse(formData.get("name"));

  const tournament = await prisma.tournaments.create({
    data: {
      name,
      userId,
    },
  });

  return redirect(`/tournaments/${tournament.id}`);
};
