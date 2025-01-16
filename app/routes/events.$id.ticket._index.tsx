import { TicketStatus } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import { stripe } from "~/utils/stripe.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const { userId } = await getAuth(args);
  const url = new URL(args.request.url);
  const earlyAccessCode = url.searchParams.get("code");

  invariant(userId, "Unauthorized");

  const event = await prisma.events.findUnique({
    where: {
      id: params.id,
      enableTicketing: true,
      ticketPrice: {
        not: null,
      },
      OR: [
        {
          ticketReleaseDate: {
            lte: new Date(),
          },
        },
        {
          earlyAccessCode,
        },
      ],
    },
    include: {
      _count: {
        select: {
          EventTickets: {
            where: {
              status: {
                notIn: [TicketStatus.CANCELLED, TicketStatus.REFUNDED],
              },
            },
          },
        },
      },
    },
  });

  if (!event) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  let ticket = await prisma.eventTickets.findUnique({
    where: {
      eventId_userId: {
        eventId: event.id,
        userId,
      },
    },
  });

  if (ticket?.status === TicketStatus.CONFIRMED) {
    // Show ticket page
    return ticket;
  }

  const isSoldOut = event._count.EventTickets >= (event.ticketCapacity ?? 0);

  // Check if sold out
  if (isSoldOut) {
    throw redirect(`/events/${event.id}`);
  }

  if (!ticket) {
    ticket = await prisma.eventTickets.create({
      data: {
        eventId: event.id,
        userId,
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: event.name,
          },
          unit_amount: Math.round((event.ticketPrice ?? 0) * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `https://rcdrift.uk/events/${event.id}/ticket/success?ticketId=${ticket.id}`,
    cancel_url: `https://rcdrift.uk/events/${event.id}`,
    metadata: {
      userId,
      ticketId: ticket.id,
    },
  });

  await prisma.eventTickets.update({
    where: {
      id: ticket.id,
    },
    data: {
      status: TicketStatus.PENDING,
      sessionId: session.id,
    },
  });

  return redirect(session.url ?? `/events/${event.id}`);
};

const Page = () => {
  return <h1>Coming soon...</h1>;
};

export default Page;
