import type { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

const pushTokenSchema = z.object({
  pushToken: z.string().min(1, "Push token is required"),
});

export const action = async (args: ActionFunctionArgs) => {
  if (args.request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  const body = await args.request.json();
  const { pushToken } = pushTokenSchema.parse(body);

  await prisma.users.update({
    where: {
      id: userId,
    },
    data: {
      pushToken,
    },
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
