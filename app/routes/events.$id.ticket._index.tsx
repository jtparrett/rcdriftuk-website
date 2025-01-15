import { TicketStatus } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { format, isBefore } from "date-fns";
import invariant from "tiny-invariant";
import { Button, LinkButton } from "~/components/Button";
import { Box, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import { stripe } from "~/utils/stripe.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const { userId } = await getAuth(args);

  invariant(userId, "Unauthorized");

  const event = await prisma.events.findUniqueOrThrow({
    where: {
      id: params.id,
    },
  });

  const ticketsSold = await prisma.eventTickets.count({
    where: {
      eventId: event.id,
      status: {
        not: TicketStatus.CANCELLED,
      },
    },
  });

  invariant(event.enableTicketing, "Event must have ticketing enabled");
  invariant(event.ticketReleaseDate, "Event must have a ticket release date");

  const isSoldOut = event.ticketCapacity && ticketsSold >= event.ticketCapacity;

  // Check if sold out
  if (isSoldOut || isBefore(new Date(), new Date(event.ticketReleaseDate))) {
    return { isSoldOut, event };
  }

  let ticket = await prisma.eventTickets.findUnique({
    where: {
      eventId_userId: {
        eventId: event.id,
        userId,
      },
    },
  });

  if (!ticket) {
    ticket = await prisma.eventTickets.create({
      data: {
        eventId: event.id,
        userId,
      },
    });
  }

  invariant(event.ticketPrice, "Event must have a ticket price");

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: event.name,
          },
          unit_amount: Math.round(event.ticketPrice * 100),
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

  invariant(session.url, "Stripe session URL is not set");

  await prisma.eventTickets.update({
    where: {
      id: ticket.id,
    },
    data: {
      status: TicketStatus.PENDING,
      sessionId: session.id,
    },
  });

  return redirect(session.url);
};

const Page = () => {
  const { isSoldOut, event } = useLoaderData<typeof loader>();

  if (isSoldOut) {
    return (
      <Box textAlign="center" py={12}>
        <styled.span fontSize="5xl">😢</styled.span>
        <styled.h1 fontSize="2xl" fontWeight="bold">
          This event is sold out
        </styled.h1>
        <styled.p mb={4}>
          Try again as more tickets may have been released.
        </styled.p>
        <Form method="post" action={`/events/${event.id}`}>
          <Button type="submit">Try Again</Button>
        </Form>
      </Box>
    );
  }

  return (
    <Box textAlign="center" py={12}>
      <styled.h1 fontSize="2xl" fontWeight="bold">
        Tickets not yet released
      </styled.h1>
      <styled.p mb={4}>
        Tickets will be released on{" "}
        {format(new Date(event.ticketReleaseDate ?? ""), "PPP")}
      </styled.p>
      <LinkButton to={`/events/${event.id}`}>Back to Event</LinkButton>
    </Box>
  );
};

export default Page;
