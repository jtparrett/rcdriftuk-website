import { TicketStatus } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { isBefore } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { LinkButton } from "~/components/Button";
import { Box, Container, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getEventDate } from "~/utils/getEventDate";
import { getUserEventTicket } from "~/utils/getUserEventTicket.server";
import { isEventSoldOut } from "~/utils/isEventSoldOut";
import { prisma } from "~/utils/prisma.server";
import { stripe } from "~/utils/stripe.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const { userId } = await getAuth(args);
  const url = new URL(args.request.url);
  const earlyAccessCode = url.searchParams.get("code");

  if (!userId) {
    throw redirect("/sign-in");
  }

  const event = await prisma.events.findUnique({
    where: {
      id: params.id,
      enableTicketing: true,
      ticketPrice: {
        not: null,
      },
      ticketReleaseDate: {
        not: null,
      },
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

  const isBeforeRelease = event?.ticketReleaseDate
    ? isBefore(
        new Date(),
        toZonedTime(new Date(event.ticketReleaseDate), "UTC")
      )
    : false;

  if (
    !event ||
    (isBeforeRelease && earlyAccessCode !== event.earlyAccessCode)
  ) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  let ticket = await getUserEventTicket(event.id, userId);

  if (ticket?.status === TicketStatus.CONFIRMED) {
    // Show ticket page
    return ticket;
  }

  if (ticket?.status === TicketStatus.PENDING && ticket?.sessionId) {
    const session = await stripe.checkout.sessions.retrieve(ticket.sessionId);

    if (session.status === "complete") {
      ticket = await prisma.eventTickets.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.CONFIRMED },
        select: {
          id: true,
          status: true,
          sessionId: true,
          event: {
            select: {
              id: true,
              name: true,
              description: true,
              cover: true,
              startDate: true,
              endDate: true,
              eventTrack: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      return ticket;
    }

    if (session.status === "expired") {
      await prisma.eventTickets.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.CANCELLED },
      });

      throw redirect(`/events/${event.id}`);
    }

    throw redirect(session.url ?? `/events/${event.id}`);
  }

  const isSoldOut = isEventSoldOut(event);

  // Check if sold out
  if (isSoldOut && ticket?.status !== TicketStatus.PENDING) {
    if (ticket) {
      await prisma.eventTickets.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.CANCELLED },
      });
    }

    throw redirect(`/events/${event.id}`);
  }

  if (!ticket) {
    ticket = await prisma.eventTickets.create({
      data: {
        eventId: event.id,
        userId,
      },
      select: {
        id: true,
        status: true,
        sessionId: true,
        event: {
          select: {
            id: true,
            name: true,
            description: true,
            cover: true,
            startDate: true,
            endDate: true,
            eventTrack: {
              select: {
                name: true,
              },
            },
          },
        },
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
      createdAt: new Date(),
    },
  });

  throw redirect(session.url ?? `/events/${event.id}`);
};

const Page = () => {
  const ticket = useLoaderData<typeof loader>();

  return (
    <Container maxW={500} px={2} py={8}>
      <Box bgColor="white" color="gray.950" overflow="hidden" rounded="2xl">
        {ticket.event.cover && (
          <Box pos="relative">
            <styled.img
              src={ticket.event.cover}
              alt={ticket.event.name}
              w="full"
            />
            <Box
              pos="absolute"
              top="100%"
              left={0}
              w={12}
              h={12}
              rounded="full"
              bg="gray.950"
              mt={-6}
              ml={-6}
            />
            <Box
              pos="absolute"
              top="100%"
              right={0}
              w={12}
              h={12}
              rounded="full"
              bg="gray.950"
              mt={-6}
              mr={-6}
            />
          </Box>
        )}
        <Box p={10}>
          <styled.h1 fontWeight="bold" fontSize="xl">
            {ticket.event.name}
          </styled.h1>
          <styled.p fontSize="sm" color="gray.600">
            {getEventDate(
              new Date(ticket.event.startDate),
              new Date(ticket.event.endDate)
            )}
          </styled.p>
          <styled.p fontSize="sm" color="gray.500" mb={4}>
            This ticket is valid for one person only
          </styled.p>

          <LinkButton to={`/events/${ticket.event.id}`} w="full">
            View Event
          </LinkButton>
        </Box>
      </Box>
    </Container>
  );
};

export default Page;
