import { json, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";
import { z } from "zod";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ message: "Method not allowed" }, 405);
  }

  const { type, data } = await request.json();
  console.log("New User", {
    data,
    type,
  });

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

  return json({ success: true }, 200);
};
