import { startOfDay } from "date-fns";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { EventCard } from "~/components/EventCard";
import { Box, Grid, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const slug = z.string().parse(params.slug);

  const events = await prisma.events.findMany({
    where: {
      startDate: {
        gte: startOfDay(new Date()),
      },
      eventTrack: {
        slug,
      },
    },
    orderBy: {
      startDate: "asc",
    },
    include: {
      eventTrack: true,
    },
  });

  return events;
};

const TrackEventsPage = () => {
  const events = useLoaderData<typeof loader>();
  const nextEvent = events[0];

  return (
    <Grid gridTemplateColumns="1fr" gap={2} p={4}>
      {events.length > 0 && nextEvent && (
        <Box
          rounded="2xl"
          overflow="hidden"
          p={1}
          bgColor="brand.500"
          pos="relative"
        >
          <Box
            py={1}
            px={4}
            pos="absolute"
            top={1}
            right={1}
            zIndex={1}
            bgColor="inherit"
            borderBottomLeftRadius="2xl"
          >
            <styled.h3 fontWeight="bold" fontSize="xs">
              NEXT
            </styled.h3>
          </Box>

          <EventCard event={nextEvent} />
        </Box>
      )}

      {events.length <= 0 && <styled.p>No events here yet...</styled.p>}

      {events.slice(1).map((event) => (
        <EventCard event={event} key={event.id} />
      ))}
    </Grid>
  );
};

export default TrackEventsPage;
