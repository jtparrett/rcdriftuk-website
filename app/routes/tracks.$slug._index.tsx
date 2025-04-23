import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { startOfDay } from "date-fns";
import { RiAddCircleFill, RiEditCircleFill, RiLink } from "react-icons/ri";
import { z } from "zod";
import { LinkButton } from "~/components/Button";
import { EventCard } from "~/components/EventCard";
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
          top={{ md: "80px" }}
          zIndex={1}
        >
          <Box
            borderWidth={1}
            borderColor="gray.800"
            rounded="xl"
            overflow="hidden"
          >
            {track.cover && (
              <Box pos="relative" mb={-16} zIndex={-1}>
                <styled.img src={track.cover} w="full" objectFit="cover" />
                <Box
                  pos="absolute"
                  inset={0}
                  bgGradient="to-b"
                  gradientTo="black"
                  gradientFrom="transparent"
                  zIndex={1}
                />
              </Box>
            )}
            <Box textAlign="center" p={4} pt={track.cover ? 0 : 4}>
              <Box
                w={32}
                h={32}
                rounded="full"
                overflow="hidden"
                borderWidth={2}
                borderColor="gray.500"
                mx="auto"
                mb={2}
              >
                <styled.img
                  src={track.image}
                  w="full"
                  h="full"
                  objectFit="cover"
                />
              </Box>

              <styled.h1
                fontWeight="extrabold"
                fontSize="2xl"
                textWrap="balance"
                lineHeight="1.1"
              >
                {track.name}
              </styled.h1>
              {track.address && (
                <styled.p fontSize="sm" color="gray.500" mt={1}>
                  {track.address}
                </styled.p>
              )}
            </Box>

            {track.description && (
              <Box p={4} bgColor="gray.800" rounded="lg" mx={4}>
                <styled.p
                  color="gray.500"
                  fontSize="sm"
                  textWrap="balance"
                  whiteSpace="pre-line"
                >
                  {track.description}
                </styled.p>
              </Box>
            )}

            <Box p={4}>
              <LinkButton
                w="full"
                to={track.url}
                variant="outline"
                target="_blank"
                size="sm"
              >
                {track.url.includes("facebook")
                  ? "Visit Facebook"
                  : "Visit Website"}
                <RiLink />
              </LinkButton>
            </Box>

            {isOwner && (
              <Box p={4} borderTopWidth={1} borderColor="gray.800">
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
              {track.events.length > 0 && (
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

                  <EventCard event={track.events[0]} />
                </Box>
              )}

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
