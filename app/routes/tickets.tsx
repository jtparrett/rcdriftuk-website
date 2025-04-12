import { TicketStatus } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { LinkButton } from "~/components/Button";
import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { token } from "~/styled-system/tokens";
import { getAuth } from "~/utils/getAuth.server";
import { getEventDate } from "~/utils/getEventDate";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw new Response(null, {
      status: 401,
      statusText: "Unauthorized",
    });
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
      return [token("colors.green.900"), token("colors.green.500")];
    case TicketStatus.PENDING:
      return [token("colors.yellow.900"), token("colors.yellow.500")];
    case TicketStatus.CANCELLED:
      return [token("colors.red.900"), token("colors.red.500")];
    case TicketStatus.REFUNDED:
      return [token("colors.purple.900"), token("colors.purple.500")];
    default:
      return [token("colors.gray.900"), token("colors.gray.500")];
  }
};

const getStatusText = (status: TicketStatus) => {
  switch (status) {
    case TicketStatus.CONFIRMED:
      return "Confirmed";
    case TicketStatus.PENDING:
      return "Pending";
    case TicketStatus.CANCELLED:
      return "Cancelled";
    case TicketStatus.REFUNDED:
      return "Refunded";
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
    <Container maxW={1100} px={2} py={4}>
      <styled.h1 fontSize="3xl" fontWeight="extrabold" pb={4}>
        My Tickets
      </styled.h1>

      <styled.div display="grid" gap={4}>
        {tickets.map((ticket) => {
          const [bgColor, textColor] = getStatusColor(ticket.status);

          return (
            <Box
              key={ticket.id}
              p={1}
              rounded="xl"
              borderWidth="1px"
              borderColor="gray.700"
              pos="relative"
              overflow="hidden"
            >
              <Box p={4} rounded="lg" borderWidth="1px" borderColor="gray.800">
                <Flex
                  flexDir={{ base: "column", md: "row" }}
                  gap={2}
                  alignItems={{ md: "center" }}
                >
                  <Box>
                    <styled.span
                      fontSize="sm"
                      fontWeight="medium"
                      style={{
                        backgroundColor: bgColor,
                        color: textColor,
                      }}
                      px={2}
                      py={1}
                      rounded="full"
                    >
                      {getStatusText(ticket.status)}
                    </styled.span>

                    <styled.h2 fontSize="xl" fontWeight="semibold" mt={2}>
                      {ticket.event.name}
                    </styled.h2>

                    <styled.p fontSize="sm" color="gray.500">
                      {getEventDate(
                        new Date(ticket.event.startDate),
                        new Date(ticket.event.endDate)
                      )}
                    </styled.p>
                    {ticket.event.eventTrack && (
                      <styled.p fontSize="sm" color="gray.500">
                        {ticket.event.eventTrack.name}
                      </styled.p>
                    )}
                  </Box>

                  <Spacer />

                  <LinkButton
                    to={`/events/${ticket.event.id}/ticket`}
                    variant="secondary"
                  >
                    View Ticket
                  </LinkButton>
                </Flex>
              </Box>
            </Box>
          );
        })}
      </styled.div>
    </Container>
  );
}
