import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { startOfDay } from "date-fns";
import { RiFacebookFill, RiLink } from "react-icons/ri";
import { z } from "zod";
import { LinkButton } from "~/components/Button";
import { ClientOnly } from "~/components/ClientOnly";
import { EventCard } from "~/components/EventCard";
import { MiniMap } from "~/components/MiniMap.client";
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
          startDate: {
            gte: startOfDay(new Date()),
          },
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

const TrackPage = () => {
  const track = useLoaderData<typeof loader>();

  return (
    <Flex
      py={8}
      gap={4}
      flexDir={{ base: "column", md: "row" }}
      alignItems={{ base: "stretch", md: "flex-start" }}
    >
      <Box
        borderWidth={1}
        borderColor="gray.800"
        rounded="xl"
        w={{ md: 400 }}
        overflow="hidden"
        pos={{ md: "sticky" }}
        top={{ md: 100 }}
        zIndex={1}
      >
        <Box h={200} mb={-100} pos="relative" zIndex={-1} pointerEvents="none">
          <ClientOnly>
            <MiniMap track={track} />
          </ClientOnly>
        </Box>

        <Box
          w={40}
          h={40}
          rounded="full"
          overflow="hidden"
          mx="auto"
          borderWidth={2}
          borderColor="gray.500"
          mb={2}
        >
          <styled.img src={track.image} w="full" h="full" objectFit="cover" />
        </Box>

        <Box textAlign="center" maxW={540} mx="auto" px={4} pb={8}>
          <styled.h1 fontWeight="black" fontSize="2xl" textWrap="balance">
            {track.name}
          </styled.h1>
          {track.description && (
            <styled.p
              color="gray.500"
              fontSize="sm"
              textWrap="balance"
              whiteSpace="pre-line"
            >
              {track.description}
            </styled.p>
          )}

          <LinkButton
            mt={4}
            to={track.url}
            variant="secondary"
            target="_blank"
            size="sm"
            fontSize="lg"
          >
            {track.url.includes("facebook") ? <RiFacebookFill /> : <RiLink />}
          </LinkButton>
        </Box>
      </Box>

      <Box flex={1}>
        {track.events.length > 0 && (
          <Box
            rounded="lg"
            overflow="hidden"
            borderWidth={3}
            borderColor="brand.500"
            bgColor="brand.500"
            mb={4}
          >
            <Box py={1} px={4} mt={-1}>
              <styled.h3 fontWeight="bold">Up Next</styled.h3>
            </Box>

            <EventCard event={track.events[0]} />
          </Box>
        )}

        <Box
          rounded="lg"
          overflow="hidden"
          borderWidth={1}
          borderColor="gray.800"
        >
          <Box py={1} px={4} bgColor="gray.800">
            <styled.h3 fontWeight="bold">Events</styled.h3>
          </Box>

          <Flex flexDir="column" gap={2} p={4}>
            {track.events.length <= 0 && <styled.p>No Events...</styled.p>}

            {track.events.map((event) => (
              <EventCard event={event} key={event.id} />
            ))}
          </Flex>
        </Box>
      </Box>
    </Flex>
  );
};

export default TrackPage;
