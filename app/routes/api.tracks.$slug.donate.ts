import { type ActionFunctionArgs, redirect } from "react-router";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import { PLATFORM_FEE_AMOUNT } from "~/utils/platformFee";
import { prisma } from "~/utils/prisma.server";
import { stripe } from "~/utils/stripe.server";

const donateSchema = z.object({
  amount: z.number().min(2),
  message: z.string().max(500).optional(),
  anonymous: z.boolean(),
});

export const action = async (args: ActionFunctionArgs) => {
  const slug = z.string().parse(args.params.slug);
  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect("/sign-in");
  }

  const body = await args.request.json();
  const values = donateSchema.parse(body);

  const track = await prisma.tracks.findFirst({
    where: {
      slug,
      stripeAccountEnabled: true,
    },
    select: {
      id: true,
      name: true,
      stripeAccountId: true,
    },
  });

  if (!track) {
    throw new Response("Track not found or donations not enabled", {
      status: 404,
    });
  }

  const donation = await prisma.donations.create({
    data: {
      trackId: track.id,
      userId: values.anonymous ? null : userId,
      amount: values.amount,
      message: values.message ?? null,
      anonymous: values.anonymous,
    },
  });

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: `Donation to ${track.name}`,
          },
          unit_amount: Math.round(values.amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `https://rcdrift.io/tracks/${slug}/donations?success=true`,
    cancel_url: `https://rcdrift.io/tracks/${slug}/donations`,
    metadata: {
      donationId: donation.id,
      trackSlug: slug,
      ...(values.anonymous ? {} : { userId }),
    },
    payment_intent_data: {
      ...(track.stripeAccountId && {
        application_fee_amount: PLATFORM_FEE_AMOUNT,
        transfer_data: {
          destination: track.stripeAccountId,
        },
      }),
    },
  });

  await prisma.donations.update({
    where: { id: donation.id },
    data: { sessionId: session.id },
  });

  return { url: session.url };
};
