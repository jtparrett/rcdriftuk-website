import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { startOfDay } from "date-fns";
import {
  RiAddCircleFill,
  RiEditCircleFill,
  RiFacebookFill,
  RiLink,
} from "react-icons/ri";
import { z } from "zod";
import { LinkButton } from "~/components/Button";
import { ClientOnly } from "~/components/ClientOnly";
import { EventCard } from "~/components/EventCard";
import { MiniMap } from "~/components/MiniMap.client";
import { styled, Box, Flex, Container } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const slug = z.string().parse(params.slug);
  const { userId } = await getAuth(args);

  const track = await prisma.tracks.findFirst({
    where: {
      slug,
    },
    include: {
      Owners: {
        ...(userId
          ? {
              where: {
                userId,
              },
            }
          : {
              take: 0,
            }),
      },
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

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `RC Drift UK | Tracks | ${data?.name}` },
    { name: "description", content: data?.description },
    {
      property: "og:image",
      content: `https://rcdrift.uk/${data?.image}`,
    },
  ];
};

const TrackPage = () => {
  const track = useLoaderData<typeof loader>();
  const isOwner = (track.Owners.length ?? 0) > 0;

  return (
    <Container px={4} pb={8} maxW={1100}>
      <Flex
        gap={4}
        flexDir={{ base: "column", md: "row" }}
        alignItems={{ base: "stretch", md: "flex-start" }}
        mt={4}
      >
        <Box
          w={{ md: 400 }}
          pos={{ md: "sticky" }}
          top={{ md: 100 }}
          zIndex={1}
        >
          <Box
            borderWidth={1}
            borderColor="gray.800"
            rounded="xl"
            overflow="hidden"
          >
            <Box
              h={200}
              mb={-100}
              pos="relative"
              zIndex={-1}
              pointerEvents="none"
            >
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
              <styled.img
                src={track.image}
                w="full"
                h="full"
                objectFit="cover"
              />
            </Box>

            <Box textAlign="center" maxW={540} mx="auto" px={4} pb={4}>
              <styled.h1
                fontWeight="extrabold"
                fontSize="2xl"
                textWrap="balance"
              >
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

              {track.address && (
                <styled.p fontSize="sm" color="gray.500">
                  {track.address}
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
                {track.url.includes("facebook") ? (
                  <RiFacebookFill />
                ) : (
                  <RiLink />
                )}
              </LinkButton>
            </Box>

            {isOwner && (
              <Box p={4}>
                <LinkButton
                  variant="outline"
                  w="full"
                  mb={2}
                  size="sm"
                  to="./edit"
                >
                  Edit Track <RiEditCircleFill />
                </LinkButton>
                <LinkButton
                  variant="outline"
                  w="full"
                  size="sm"
                  mb={2}
                  to="./events/new"
                >
                  Create Event <RiAddCircleFill />
                </LinkButton>
              </Box>
            )}
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
              {track.events.length <= 0 && (
                <styled.p>No events here yet...</styled.p>
              )}

              {track.events.slice(1).map((event) => (
                <EventCard event={event} key={event.id} />
              ))}
            </Flex>
          </Box>
        </Box>
      </Flex>
    </Container>
  );
};

export default TrackPage;
