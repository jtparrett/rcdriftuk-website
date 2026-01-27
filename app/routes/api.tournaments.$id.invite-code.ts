import { type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import crypto from "crypto";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString("hex");
}

export const action = async (args: ActionFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  // Verify tournament exists and user owns it
  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      id: true,
    },
  });

  notFoundInvariant(tournament, "Tournament not found");

  // Generate a unique invite code (retry if collision)
  let inviteCode = generateInviteCode();
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const existing = await prisma.tournaments.findUnique({
      where: { inviteCode },
      select: { id: true },
    });

    if (!existing || existing.id === id) {
      break;
    }

    inviteCode = generateInviteCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Response("Failed to generate unique invite code", {
      status: 500,
    });
  }

  // Update the tournament with the new invite code
  await prisma.tournaments.update({
    where: { id },
    data: { inviteCode },
  });

  return { inviteCode };
};
