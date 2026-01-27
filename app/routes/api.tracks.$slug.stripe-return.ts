import { type LoaderFunctionArgs, redirect } from "react-router";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import { stripe } from "~/utils/stripe.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const slug = z.string().parse(args.params.slug);
  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect("/sign-in");
  }

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
      stripeAccountId: true,
    },
  });

  if (!track || !track.stripeAccountId) {
    throw redirect(`/edit/track/${slug}`);
  }

  // Check the account status
  const account = await stripe.accounts.retrieve(track.stripeAccountId);

  // Update the track based on whether the account is fully onboarded
  const isEnabled =
    account.charges_enabled &&
    account.payouts_enabled &&
    account.details_submitted;

  await prisma.tracks.update({
    where: { id: track.id },
    data: { stripeAccountEnabled: isEnabled },
  });

  // Redirect back to the edit track page
  throw redirect(`/edit/track/${slug}`);
};
