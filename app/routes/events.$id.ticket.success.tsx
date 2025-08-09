import { TicketStatus } from "~/utils/enums";
import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import invariant from "~/utils/invariant";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import { Box, styled } from "~/styled-system/jsx";
import { useReloader } from "~/utils/useReloader";
import { LinkButton } from "~/components/Button";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const url = new URL(args.request.url);
  const ticketId = z.string().parse(url.searchParams.get("ticketId"));

  invariant(userId, "User is not signed in");

  const ticket = await prisma.eventTickets.findUnique({
    where: {
      id: Number(ticketId),
      userId,
    },
    include: {
      event: true,
    },
  });

  invariant(ticket, "Ticket not found");

  return ticket;
};

const Page = () => {
  const ticket = useLoaderData<typeof loader>();

  useReloader(1000);

  if (ticket.status === TicketStatus.CONFIRMED) {
    return (
      <Box textAlign="center" py={12} maxWidth={460} mx="auto">
        <styled.span fontSize="5xl">🎉</styled.span>
        <styled.h1 fontSize="2xl" fontWeight="bold" textWrap="balance">
          You're going to {ticket.event.name}
        </styled.h1>
        <styled.p mb={2} textWrap="balance">
          We'll send you a confirmation email shortly. Be sure to check any
          track/event rules prior to attending this event.
        </styled.p>
        <styled.p mb={4} textWrap="balance">
          P.S check your spam folder if you don't see confirmation in your
          inbox.
        </styled.p>
        <LinkButton to={`/events/${ticket.eventId}`}>Back to Event</LinkButton>
      </Box>
    );
  }

  if (ticket.status === TicketStatus.PENDING) {
    return (
      <Box textAlign="center" py={12}>
        <styled.h1 fontSize="2xl" fontWeight="bold">
          Please wait...
        </styled.h1>
        <styled.p>
          We're confirming your ticket. This may take a few minutes.
        </styled.p>
      </Box>
    );
  }

  if (ticket.status === TicketStatus.REFUNDED) {
    return (
      <Box textAlign="center" py={12}>
        <styled.h1 fontSize="2xl" fontWeight="bold">
          Something went wrong
        </styled.h1>
        <styled.p mb={4}>Your ticket has been refunded</styled.p>
        <LinkButton to={`/events/${ticket.eventId}`}>Back to Event</LinkButton>
      </Box>
    );
  }

  return (
    <Box textAlign="center" py={12}>
      <styled.h1 fontSize="2xl" fontWeight="bold">
        Something went wrong
      </styled.h1>
      <styled.p mb={4}>
        We couldn't confirm your ticket. Please try again later.
      </styled.p>
      <LinkButton to={`/events/${ticket.eventId}`}>Back to Event</LinkButton>
    </Box>
  );
};

export default Page;
