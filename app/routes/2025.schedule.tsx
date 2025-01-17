import { TicketStatus } from "@prisma/client";
import type { MetaFunction } from "@remix-run/react";
import { useLoaderData } from "@remix-run/react";
import { EventTicketStatus } from "~/components/EventTicketStatus";
import { LinkOverlay } from "~/components/LinkOverlay";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { getEventDate } from "~/utils/getEventDate";
import { isEventSoldOut } from "~/utils/isEventSoldOut";
import { prisma } from "~/utils/prisma.server";

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

  return (
    <Container px={2} maxW={1100}>
      <styled.div pt={4} pb={12}>
        <styled.h1 fontSize="3xl" mb={1} fontWeight="black">
          2025 Schedule
        </styled.h1>
        <Box h={1} bgColor="brand.500" w={12} mb={4} />

        <Box overflow="hidden">
          <Flex flexWrap="wrap" ml={-4} mt={-4}>
            {events.map((event) => {
              const startDate = new Date(event.startDate);
              const endDate = new Date(event.endDate);
              const isSoldOut = isEventSoldOut(event);

              return (
                <Flex
                  key={event.id}
                  pt={4}
                  pl={4}
                  w={{ base: "50%", lg: "33.3333%" }}
                >
                  <styled.article
                    bgColor="gray.900"
                    overflow="hidden"
                    rounded="lg"
                    pos="relative"
                    w="full"
                    borderWidth={1}
                    borderColor="gray.800"
                  >
                    <styled.img
                      src={event.cover ?? "/2025-cover.jpg"}
                      alt={event.name}
                      w="full"
                    />
                    <Box p={4}>
                      <styled.h1
                        fontWeight="bold"
                        textWrap="balance"
                        fontSize="lg"
                      >
                        {event.name}
                      </styled.h1>

                      <styled.p color="gray.400" fontSize="sm">
                        {getEventDate(startDate, endDate)}
                      </styled.p>

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
                    <LinkOverlay to={`/events/${event.id}`} />
                  </styled.article>
                </Flex>
              );
            })}
          </Flex>
        </Box>
      </styled.div>
    </Container>
  );
};

export default Page;
