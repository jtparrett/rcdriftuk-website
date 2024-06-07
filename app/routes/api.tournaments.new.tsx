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
  const eventId = z.string().parse(formData.get("eventId"));

  const event = await prisma.events.findFirst({
    where: {
      id: eventId,
      eventTrack: {
        owners: {
          some: {
            id: userId,
          },
        },
      },
    },
  });

  invariant(event);

  const tournament = await prisma.tournaments.create({
    data: {
      eventId,
    },
  });

  return redirect(`/tournaments/${tournament.id}`);
};
