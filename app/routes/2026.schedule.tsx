import { TicketStatus } from "~/utils/enums";
import type { Route } from "./+types/2026.schedule";
import { useLoaderData } from "react-router";
import { EventTicketStatus } from "~/components/EventTicketStatus";
import { LinkOverlay } from "~/components/LinkOverlay";
import { AspectRatio, Box, Container, Flex, styled } from "~/styled-system/jsx";
import { getEventDate } from "~/utils/getEventDate";
import { isEventSoldOut } from "~/utils/isEventSoldOut";
import { prisma } from "~/utils/prisma.server";
import { endOfYear, format, isAfter, isBefore, startOfYear } from "date-fns";
import { AppName } from "~/utils/enums";

export const meta: Route.MetaFunction = () => {
  return [
    { title: `${AppName} | 2026 Schedule` },
    {
      name: "description",
      content: "2026 Schedule",
    },
  ];
};

export const loader = async () => {
  const events = await prisma.events.findMany({
    where: {
      rated: true,
      startDate: {
        gte: startOfYear(new Date(2026, 0, 1)),
      },
      endDate: {
        lte: endOfYear(new Date(2026, 11, 31)),
      },
    },
    include: {
      eventTrack: true,
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
    orderBy: {
      startDate: "asc",
    },
  });

  return events;
};

const Page = () => {
  const events = useLoaderData<typeof loader>();

  // Group events by month
  const eventsByMonth = events.reduce(
    (acc, event) => {
      const startDate = new Date(event.startDate);
      const monthKey = format(startDate, "MMMM");
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(event);
      return acc;
    },
    {} as Record<string, typeof events>,
  );

  return (
    <Container px={4} maxW={1100}>
      <styled.div pt={8} pb={12}>
        <styled.h1 fontSize="4xl" mb={4} fontWeight="extrabold">
          2026 Schedule
        </styled.h1>

        {Object.entries(eventsByMonth).map(([month, monthEvents]) => (
          <Box
            key={month}
            mb={4}
            borderWidth={1}
            borderColor="gray.900"
            rounded="xl"
            overflow="hidden"
          >
            <Box px={4} py={2} bgColor="gray.900">
              <styled.h2 fontWeight="bold">{month}</styled.h2>
            </Box>
            <Box overflow="hidden" p={4}>
              <Flex flexWrap="wrap" ml={-4} mt={-4}>
                {monthEvents.map((event) => {
                  const startDate = new Date(event.startDate);
                  const endDate = new Date(event.endDate);
                  const isSoldOut = isEventSoldOut(event);
                  const isFinished = isAfter(
                    new Date(),
                    new Date(event.endDate),
                  );

                  return (
                    <Flex
                      key={event.id}
                      pt={4}
                      pl={4}
                      w={{ base: "100%", md: "50%", lg: "33.3333%" }}
                      opacity={isFinished ? 0.5 : 1}
                    >
                      <styled.article
                        overflow="hidden"
                        rounded="lg"
                        pos="relative"
                        w="full"
                        borderWidth={1}
                        borderColor={"gray.800"}
                        bgColor="gray.900"
                      >
                        <AspectRatio ratio={1.6}>
                          <styled.img
                            src={event.cover ?? event.eventTrack?.image ?? ""}
                            alt={event.name}
                            w="full"
                          />
                        </AspectRatio>
                        <Box p={4}>
                          <styled.h1
                            fontWeight="bold"
                            textWrap="balance"
                            fontSize="lg"
                          >
                            {event.name}
                          </styled.h1>

                          <styled.p color="gray.400" fontSize="sm" mt={1}>
                            {getEventDate(startDate, endDate)}
                          </styled.p>

                          {isBefore(new Date(), new Date(event.startDate)) && (
                            <Box mt={2}>
                              <EventTicketStatus
                                isSoldOut={isSoldOut}
                                event={{
                                  ...event,
                                  ticketReleaseDate: event.ticketReleaseDate
                                    ? new Date(event.ticketReleaseDate)
                                    : null,
                                }}
                              />
                            </Box>
                          )}

                          {isFinished && (
                            <Box mt={2}>
                              <styled.p color="gray.500" fontSize="sm">
                                This event has ended.
                              </styled.p>
                            </Box>
                          )}
                        </Box>
                        <LinkOverlay to={`/events/${event.id}`} />
                      </styled.article>
                    </Flex>
                  );
                })}
              </Flex>
            </Box>
          </Box>
        ))}
      </styled.div>
    </Container>
  );
};

export default Page;
