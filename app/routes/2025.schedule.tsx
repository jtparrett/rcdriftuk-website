import { TicketStatus } from "@prisma/client";
import type { MetaFunction } from "@remix-run/react";
import { useLoaderData } from "@remix-run/react";
import { EventTicketStatus } from "~/components/EventTicketStatus";
import { LinkOverlay } from "~/components/LinkOverlay";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { getEventDate } from "~/utils/getEventDate";
import { isEventSoldOut } from "~/utils/isEventSoldOut";
import { prisma } from "~/utils/prisma.server";
import { format } from "date-fns";

export function headers() {
  return {
    "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
  };
}

export const meta: MetaFunction = () => {
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

export const loader = async () => {
  const events = await prisma.events.findMany({
    where: {
      id: {
        in: [
          "a007a66b-5ca0-4c70-89a2-4376741cfb49",
          "ee96fd7f-fa44-4992-ac75-dd4c97b66bb8",
          "f45b882f-586b-48cb-b5b7-94b317ea7b91",
          "d1e3c5d2-b98c-4af7-acce-3b661fbff366",
          "5b525d7e-2209-419d-8c90-cbb58054d002",
          "db4b9b3a-4b5f-4787-af31-a632726a4402",
          "1e60715e-d4de-4c17-a7c4-11e059ae5da7",
          "0f787c3a-827b-482e-823b-7d297eccc700",
          "13c17375-8fd1-4965-9fec-097b297bed0c",
          "a065c0c6-98eb-491a-b49b-3f1484936b91",
          "d17cd9d1-1eaf-48dd-a2a3-c8845fc74c26",
          "760859d8-2693-4cca-a38c-3af6be4885d7",
          "6b147fbf-50d5-4f73-9085-f405095af2d4",
          "99a85a05-b241-4c49-af81-1aa201efcb29",
          "7d468d79-950c-4f5d-9f47-379126430364",
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
  const eventsByMonth = events.reduce((acc, event) => {
    const startDate = new Date(event.startDate);
    const monthKey = format(startDate, "MMMM");
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  // Find main event (November 8-9)
  const mainEvent = events.find(event => {
    const startDate = new Date(event.startDate);
    return format(startDate, "MMMM d") === "November 8";
  });

  return (
    <Container px={2} maxW={1100}>
      <styled.div pt={4} pb={12}>
        <styled.h1 fontSize="3xl" mb={1} fontWeight="black">
          2025 Schedule
        </styled.h1>
        <Box h={1} bgColor="brand.500" w={12} mb={4} />

        {mainEvent && (
          <>
            <styled.h2 fontSize="xl" mb={4} fontWeight="bold">
              Main Event
            </styled.h2>
            <Box overflow="hidden" mb={8}>
              <Flex>
                <Box w="full">
                  <styled.article
                    bgColor="gray.900"
                    overflow="hidden"
                    rounded="lg"
                    pos="relative"
                    w="full"
                    borderWidth={2}
                    borderColor="brand.500"
                  >
                    <styled.img
                      src={mainEvent.cover ?? "/2025-cover.jpg"}
                      alt={mainEvent.name}
                      w="full"
                      h="300px"
                      objectFit="cover"
                    />
                    <Box p={6}>
                      <styled.h1
                        fontWeight="black"
                        textWrap="balance"
                        fontSize="2xl"
                        mb={2}
                      >
                        {mainEvent.name}
                      </styled.h1>

                      <styled.p color="gray.400" fontSize="lg" mb={4}>
                        {getEventDate(new Date(mainEvent.startDate), new Date(mainEvent.endDate))}
                      </styled.p>

                      <EventTicketStatus
                        isSoldOut={isEventSoldOut(mainEvent)}
                        event={{
                          ...mainEvent,
                          ticketReleaseDate: mainEvent.ticketReleaseDate
                            ? new Date(mainEvent.ticketReleaseDate)
                            : null,
                        }}
                      />
                    </Box>
                    <LinkOverlay to={`/events/${mainEvent.id}`} />
                  </styled.article>
                </Box>
              </Flex>
            </Box>
          </>
        )}

        {Object.entries(eventsByMonth).map(([month, monthEvents]) => (
          <Box 
            key={month} 
            mb={8}
            p={6}
            bgColor="gray.900"
            borderWidth={1}
            borderColor="gray.800"
            rounded="xl"
          >
            <styled.h2 
              fontSize="xl" 
              mb={4} 
              fontWeight="bold"
              pb={2}
              borderBottomWidth={1}
              borderColor="gray.800"
            >
              {month}
            </styled.h2>
            <Box overflow="hidden">
              <Flex flexWrap="wrap" ml={-4} mt={-4}>
                {monthEvents.map(event => {
                  const startDate = new Date(event.startDate);
                  const endDate = new Date(event.endDate);
                  const isSoldOut = isEventSoldOut(event);
                  const isMainEvent = event.id === mainEvent?.id;

                  return (
                    <Flex
                      key={event.id}
                      pt={4}
                      pl={4}
                      w={{ base: "100%", md: "50%", lg: "33.3333%" }}
                    >
                      <styled.article
                        bgColor="black"
                        overflow="hidden"
                        rounded="lg"
                        pos="relative"
                        w="full"
                        borderWidth={isMainEvent ? 2 : 1}
                        borderColor={isMainEvent ? "brand.500" : "gray.800"}
                      >
                        <styled.img
                          src={event.cover ?? "/2025-cover.jpg"}
                          alt={event.name}
                          w="full"
                          h={isMainEvent ? "200px" : "160px"}
                          objectFit="cover"
                        />
                        <Box p={isMainEvent ? 5 : 4}>
                          <styled.h1
                            fontWeight={isMainEvent ? "black" : "bold"}
                            textWrap="balance"
                            fontSize={isMainEvent ? "xl" : "lg"}
                          >
                            {event.name}
                            {isMainEvent && (
                              <styled.span 
                                ml={2} 
                                color="brand.500" 
                                fontSize="sm"
                                fontWeight="bold"
                              >
                                MAIN EVENT
                              </styled.span>
                            )}
                          </styled.h1>

                          <styled.p 
                            color="gray.400" 
                            fontSize={isMainEvent ? "md" : "sm"}
                            mt={1}
                          >
                            {getEventDate(startDate, endDate)}
                          </styled.p>

                          <Box mt={isMainEvent ? 4 : 2}>
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
