import { type ActionFunctionArgs } from "react-router";
import { prisma } from "~/utils/prisma.server";
import { z } from "zod";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { type, data } = await request.json();
  console.log("New User", {
    data,
    type,
  });

  const userData = z
    .object({
      id: z.string(),
      first_name: z.string().nullable().optional(),
      last_name: z.string().nullable().optional(),
      profile_image_url: z.string().nullable().optional(),
    })
    .parse(data);

  switch (type) {
    case "user.created":
      await prisma.users.create({
        data: {
          id: userData.id,
          firstName: userData.first_name,
          lastName: userData.last_name,
          image: userData.profile_image_url,
        },
      });
      break;

    case "user.updated":
      await prisma.users.update({
        where: {
          id: userData.id,
        },
        data: {
          firstName: userData.first_name,
          lastName: userData.last_name,
          image: userData.profile_image_url,
        },
      });
      break;

    default:
      throw new Error("Unsupported clerk event");
  }

  return new Response("Success", { status: 200 });
};
