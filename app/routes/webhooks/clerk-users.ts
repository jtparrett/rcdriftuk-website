import type { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";
import { z } from "zod";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { type, data } = await request.json();

  const userData = z
    .object({
      id: z.string(),
    })
    .parse(data);

  switch (type) {
    case "user.created":
      await prisma.users.create({
        data: {
          id: userData.id,
        },
      });
      break;

    default:
      throw new Error("Unsupported clerk event");
  }

  return {};
};
