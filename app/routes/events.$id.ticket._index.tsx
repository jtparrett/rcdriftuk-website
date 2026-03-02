import { TicketStatus } from "~/utils/enums";
import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { useLoaderData } from "react-router";
import { isBefore } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { LinkButton } from "~/components/Button";
import { Box, Container, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getEventDate } from "~/utils/getEventDate";
import { getUserEventTicket } from "~/utils/getUserEventTicket.server";
import { isEventSoldOut } from "~/utils/isEventSoldOut";
import { PLATFORM_FEE_AMOUNT } from "~/utils/platformFee";
import { prisma } from "~/utils/prisma.server";
import { stripe } from "~/utils/stripe.server";
import { getDriverRank } from "~/utils/getDriverRank";
import { adjustDriverElo } from "~/utils/adjustDriverElo.server";
import { z } from "zod";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const { userId } = await getAuth(args);
  const url = new URL(args.request.url);
  const earlyAccessCode = url.searchParams.get("code");
  const ticketTypeIdParam = url.searchParams.get("ticketTypeId");

  if (!userId) {
    throw redirect("/sign-in");
  }

  let ticket = await getUserEventTicket(params.id!, userId);

  if (ticket?.status === TicketStatus.CONFIRMED) {
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
          ticketType: {
            select: { id: true, name: true, price: true },
          },
          event: {
            select: {
              id: true,
              name: true,
              description: true,
              cover: true,
              startDate: true,
              endDate: true,
              eventTrack: { select: { name: true } },
            },
          },
        },
      });

      return ticket;
    }

    if (session.status === "expired") {
      await prisma.eventTickets.delete({ where: { id: ticket.id } });
      throw redirect(`/events/${params.id}`);
    }

    throw redirect(session.url ?? `/events/${params.id}`);
  }

  // Delete any stale ticket (REFUNDED, orphaned PENDING) so user can start fresh
  if (ticket) {
    await prisma.eventTickets.delete({ where: { id: ticket.id } });
    ticket = null;
  }

  if (!ticketTypeIdParam) {
    throw redirect(`/events/${params.id}`);
  }

  const ticketTypeId = z.coerce.number().positive().parse(ticketTypeIdParam);

  const ticketType = await prisma.eventTicketTypes.findUnique({
    where: { id: ticketTypeId },
    include: {
      event: {
        select: {
          id: true,
          name: true,
          description: true,
          cover: true,
          startDate: true,
          endDate: true,
          ticketCapacity: true,
          earlyAccessCode: true,
          eventTrack: {
            select: {
              stripeAccountId: true,
              name: true,
            },
          },
          _count: {
            select: {
              EventTickets: {
                where: {
                  status: { notIn: [TicketStatus.REFUNDED] },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!ticketType || ticketType.event.id !== params.id) {
    throw new Response(null, { status: 404, statusText: "Not Found" });
  }

  const event = ticketType.event;

  const londonTimeNow = toZonedTime(new Date(), "Europe/London");
  const isBeforeRelease = isBefore(londonTimeNow, ticketType.releaseDate);

  if (isBeforeRelease && earlyAccessCode !== event.earlyAccessCode) {
    throw new Response(null, { status: 404, statusText: "Not Found" });
  }

  if (ticketType.allowedRanks.length > 0) {
    const user = await prisma.users.findFirst({
      where: { id: userId },
      select: {
        elo_UK: true,
        elo_EU: true,
        elo_NA: true,
        elo_ZA: true,
        elo_LA: true,
        elo_AP: true,
        ranked: true,
        lastBattleDate: true,
      },
    });

    if (user) {
      const bestRegionalElo = Math.max(
        adjustDriverElo(user.elo_UK, user.lastBattleDate),
        adjustDriverElo(user.elo_EU, user.lastBattleDate),
        adjustDriverElo(user.elo_NA, user.lastBattleDate),
        adjustDriverElo(user.elo_ZA, user.lastBattleDate),
        adjustDriverElo(user.elo_LA, user.lastBattleDate),
        adjustDriverElo(user.elo_AP, user.lastBattleDate),
      );
      const userRank = getDriverRank(bestRegionalElo, user.ranked);

      if (!ticketType.allowedRanks.includes(userRank)) {
        throw redirect(`/events/${event.id}`);
      }
    } else {
      throw redirect(`/events/${event.id}`);
    }
  }

  if (isEventSoldOut(event)) {
    throw redirect(`/events/${event.id}`);
  }

  ticket = await prisma.eventTickets.create({
    data: {
      eventId: event.id,
      userId,
      ticketTypeId: ticketType.id,
    },
    select: {
      id: true,
      status: true,
      sessionId: true,
      ticketType: {
        select: { id: true, name: true, price: true },
      },
      event: {
        select: {
          id: true,
          name: true,
          description: true,
          cover: true,
          startDate: true,
          endDate: true,
          eventTrack: { select: { name: true } },
        },
      },
    },
  });

  const stripeAccountId = event.eventTrack?.stripeAccountId;

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: `${event.name} - ${ticketType.name}`,
          },
          unit_amount: Math.round(ticketType.price * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `https://rcdrift.io/events/${event.id}/ticket/success?ticketId=${ticket.id}`,
    cancel_url: `https://rcdrift.io/events/${event.id}`,
    metadata: {
      userId,
      ticketId: ticket.id,
    },
    payment_intent_data: {
      ...(stripeAccountId && {
        application_fee_amount: PLATFORM_FEE_AMOUNT,
        transfer_data: {
          destination: stripeAccountId,
        },
      }),
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
          {ticket.ticketType && (
            <styled.p fontSize="sm" color="gray.500" fontWeight="semibold">
              {ticket.ticketType.name}
            </styled.p>
          )}
          <styled.p fontSize="sm" color="gray.600">
            {getEventDate(
              new Date(ticket.event.startDate),
              new Date(ticket.event.endDate),
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
