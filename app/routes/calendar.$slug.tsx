import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { EventCard } from "~/components/EventCard";
import { styled, Box, Flex } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const slug = z.string().parse(params.slug);

  const track = await prisma.tracks.findFirst({
    where: {
      slug,
    },
    include: {
      events: {
        where: {
          approved: true,
        },
        include: {
          eventTrack: true,
        },
        orderBy: {
          startDate: "asc",
        },
      },
    },
  });

  if (!track) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  return track;
};

const CalendarTrackPage = () => {
  const track = useLoaderData<typeof loader>();

  return (
    <Box py={8}>
      <Box
        w={40}
        h={40}
        rounded="full"
        overflow="hidden"
        mx="auto"
        borderWidth={2}
        borderColor="gray.500"
        mb={4}
      >
        <styled.img src={track.image} w="full" h="full" objectFit="cover" />
      </Box>

      <Box textAlign="center" maxW={540} mx="auto" px={4} pb={8}>
        <styled.h1 fontWeight="bold" fontSize="2xl">
          {track.name}
        </styled.h1>
        <styled.p>{track.description}</styled.p>
      </Box>

      <Box rounded="sm" overflow="hidden" bgColor="gray.900">
        <Box
          p={1}
          textAlign="center"
          bgColor="gray.800"
          borderBottomWidth={1}
          borderColor="gray.700"
        >
          <styled.h3>Events</styled.h3>
        </Box>

        <Flex flexDir="column" gap={2} p={4}>
          {track.events.length <= 0 && <styled.p>No Events...</styled.p>}

          {track.events.map((event) => (
            <EventCard event={event} key={event.id} />
          ))}
        </Flex>
      </Box>
    </Box>
  );
};

export default CalendarTrackPage;
