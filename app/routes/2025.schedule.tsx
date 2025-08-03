import { TicketStatus } from "~/utils/enums";
import type { Route } from "./+types/2025";
import { useLoaderData } from "react-router";
import { EventTicketStatus } from "~/components/EventTicketStatus";
import { LinkOverlay } from "~/components/LinkOverlay";
import { AspectRatio, Box, Container, Flex, styled } from "~/styled-system/jsx";
import { getEventDate } from "~/utils/getEventDate";
import { isEventSoldOut } from "~/utils/isEventSoldOut";
import { prisma } from "~/utils/prisma.server";
import { format, isAfter, isBefore } from "date-fns";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "RC Drift UK | 2025 Schedule" },
    {
      name: "description",
      content: "Welcome to RCDrift.uk 2025 Schedule",
    },
    {
      property: "og:image",
      content: "https://rcdrift.uk/2025-cover.jpg",
    },
  ];
};

const MAIN_EVENT_ID = "760859d8-2693-4cca-a38c-3af6be4885d7";

export const loader = async () => {
  const events = await prisma.events.findMany({
    where: {
      id: {
        in: [
          MAIN_EVENT_ID,
          "a007a66b-5ca0-4c70-89a2-4376741cfb49",
          "ee96fd7f-fa44-4992-ac75-dd4c97b66bb8",
          "f45b882f-586b-48cb-b5b7-94b317ea7b91",
          "d1e3c5d2-b98c-4af7-acce-3b661fbff366",
          "5b525d7e-2209-419d-8c90-cbb58054d002",
          "db4b9b3a-4b5f-4787-af31-a632726a4402",
          "de9beb33-ae4f-45c6-8060-a9cfad0f932e",
          "0f787c3a-827b-482e-823b-7d297eccc700",
          "13c17375-8fd1-4965-9fec-097b297bed0c",
          "a065c0c6-98eb-491a-b49b-3f1484936b91",
          "d17cd9d1-1eaf-48dd-a2a3-c8845fc74c26",
          "6b147fbf-50d5-4f73-9085-f405095af2d4",
          "99a85a05-b241-4c49-af81-1aa201efcb29",
          "9c7a9c38-0ca5-444d-8596-cfb37b7c900d",
          "7d468d79-950c-4f5d-9f47-379126430364",
          "71f7f4a7-0e62-4f3d-8d32-d19b77eefa49",
          "73b48b6c-8839-486c-a6f9-cc627b927731",
          "e52f8cc0-0e32-4491-91e1-fdd31065592a", // Test
        ],
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
          2025 Schedule
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
                        <AspectRatio ratio={16 / 7}>
                          <styled.img
                            src={event.cover ?? "/2025-cover.jpg"}
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
