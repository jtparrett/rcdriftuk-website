import type { ActionFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { z } from "zod";
import { prisma } from "~/utils/prisma.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  invariant(process.env.SLACK_TOKEN);

  const payloadSchema = z.object({
    token: z.literal(process.env.SLACK_TOKEN),
    actions: z
      .array(
        z.object({
          value: z.string(),
          action_id: z.literal("approve"),
        })
      )
      .min(1),
    response_url: z.string(),
  });

  const body = await request.formData();
  const payload = body.get("payload")?.toString() ?? "{}";

  const result = payloadSchema.parse(JSON.parse(payload));
  const action = result.actions[0];
  const eventId = action.value;

  const event = await prisma.events.findFirst({
    where: {
      id: eventId,
    },
  });

  invariant(event, "Cannot find event");

  await prisma.events.updateMany({
    where: {
      trackId: event.trackId,
      approved: false,
      name: event.name,
      createdAt: event.createdAt,
    },
    data: {
      approved: true,
    },
  });

  await fetch(result.response_url, {
    method: "POST",
    body: JSON.stringify({
      text: `Event(s) now approved`,
    }),
  });

  return null;
};
