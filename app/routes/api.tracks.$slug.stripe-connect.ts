import { type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";
import { stripe } from "~/utils/stripe.server";

export const action = async (args: ActionFunctionArgs) => {
  const slug = z.string().parse(args.params.slug);
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  // Verify track exists and user owns it
  const track = await prisma.tracks.findFirst({
    where: {
      slug,
      Owners: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      stripeAccountId: true,
    },
  });

  notFoundInvariant(track, "Track not found");

  let accountId = track.stripeAccountId;

  // Create a Stripe Connect account if one doesn't exist
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "standard",
      metadata: {
        trackId: track.id,
      },
    });

    accountId = account.id;

    // Save the account ID to the track
    await prisma.tracks.update({
      where: { id: track.id },
      data: { stripeAccountId: accountId },
    });
  }

  // Create an account link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `https://rcdrift.io/api/tracks/${slug}/stripe-connect`,
    return_url: `https://rcdrift.io/api/tracks/${slug}/stripe-return`,
    type: "account_onboarding",
  });

  return { url: accountLink.url };
};
