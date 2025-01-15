import { getAuth } from "@clerk/remix/ssr.server";
import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useParams } from "@remix-run/react";
import invariant from "tiny-invariant";
import { Button } from "~/components/Button";
import { Box, Center, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { stripe } from "~/utils/stripe.server";

export const action = async (args: ActionFunctionArgs) => {
  const { params } = args;
  const { userId } = await getAuth(args);

  invariant(userId, "Unauthorized");

  const event = await prisma.events.findUniqueOrThrow({
    where: {
      id: params.id,
    },
    include: {
      EventTickets: true,
    },
  });

  // Check if sold out
  if (
    event.ticketCapacity &&
    event.EventTickets.length >= event.ticketCapacity
  ) {
    return;
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
    success_url: `https://rcdrift.uk/events/${event.id}/ticket/success`,
    cancel_url: `https://rcdrift.uk/events/${event.id}`,
    metadata: {
      userId,
      ticketId: ticket.id,
    },
  });

  invariant(session.url, "Stripe session URL is not set");

  return redirect(session.url);
};

const Page = () => {
  const { id } = useParams();
  return (
    <Center minH="50vh">
      <Box textAlign="center">
        <styled.span fontSize="5xl">😢</styled.span>
        <styled.h1 fontSize="2xl" fontWeight="bold">
          This event is sold out
        </styled.h1>
        <styled.p mb={4}>
          Try again as more tickets may have been released.
        </styled.p>
        <Form method="post" action={`/events/${id}/ticket`}>
          <Button type="submit">Try Again</Button>
        </Form>
      </Box>
    </Center>
  );
};

export default Page;
