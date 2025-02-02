import { TicketStatus } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { LinkButton } from "~/components/Button";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getEventDate } from "~/utils/getEventDate";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const tickets = await prisma.eventTickets.findMany({
    where: {
      userId,
      status: {
        in: [TicketStatus.CONFIRMED, TicketStatus.PENDING],
      },
    },
    include: {
      event: {
        include: {
          eventTrack: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return tickets;
};

const getStatusColor = (status: TicketStatus) => {
  switch (status) {
    case TicketStatus.CONFIRMED:
      return "green.500";
    case TicketStatus.PENDING:
      return "yellow.500";
    default:
      return "gray.500";
  }
};

const getStatusText = (status: TicketStatus) => {
  switch (status) {
    case TicketStatus.CONFIRMED:
      return "Confirmed";
    case TicketStatus.PENDING:
      return "Pending";
    default:
      return status;
  }
};

export default function TicketsPage() {
  const tickets = useLoaderData<typeof loader>();

  if (tickets.length === 0) {
    return (
      <Container py={12}>
        <Box textAlign="center">
          <styled.h1 fontSize="2xl" fontWeight="bold" mb={4}>
            My Tickets
          </styled.h1>
          <styled.p color="gray.600" mb={6}>
            You don't have any tickets yet.
          </styled.p>
          <LinkButton to="/2025/schedule">View Events</LinkButton>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW={1100} px={2} py={12}>
      <styled.h1 fontSize="2xl" fontWeight="bold" mb={6}>
        My Tickets
      </styled.h1>

      <styled.div display="grid" gap={4}>
        {tickets.map((ticket) => (
          <Box
            key={ticket.id}
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="md"
            p={4}
          >
            <Flex justify="space-between" align="center" mb={2}>
              <styled.h2 fontSize="lg" fontWeight="semibold">
                {ticket.event.name}
              </styled.h2>
              <styled.span
                fontSize="sm"
                fontWeight="medium"
                color={getStatusColor(ticket.status)}
              >
                {getStatusText(ticket.status)}
              </styled.span>
            </Flex>

            <styled.p color="gray.600" fontSize="sm" mb={3}>
              {getEventDate(
                new Date(ticket.event.startDate),
                new Date(ticket.event.endDate)
              )}
              {ticket.event.eventTrack && (
                <> • {ticket.event.eventTrack.name}</>
              )}
            </styled.p>
          </Box>
        ))}
      </styled.div>
    </Container>
  );
}
