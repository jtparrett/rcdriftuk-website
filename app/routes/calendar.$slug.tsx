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

const CalendarTrackPage = () => {
  const track = useLoaderData<typeof loader>();

  return (
    <Flex py={8} gap={4} flexDir={{ base: "column", md: "row" }}>
      <Box
        p={8}
        borderWidth={1}
        borderColor="gray.800"
        rounded="xl"
        w={{ md: 400 }}
      >
        <Box pos="sticky" top={100}>
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
      </Box>

      <Box flex={1}>
        <Box
          mb={4}
          h={240}
          rounded="xl"
          overflow="hidden"
          pos="relative"
          zIndex={1}
          _after={{
            content: '""',
            pos: "absolute",
            inset: 0,
            bgGradient: "to-b",
            gradientTo: "rgba(0, 0, 0, 0.9)",
            gradientFrom: "transparent",
            zIndex: 9999,
          }}
        >
          <ClientOnly>
            <MiniMap track={track} />
          </ClientOnly>
        </Box>

        <Box
          rounded="xl"
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

export default CalendarTrackPage;
