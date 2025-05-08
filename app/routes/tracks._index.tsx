import { SignedIn } from "@clerk/react-router";
import { TrackStatus } from "@prisma/client";
import { useLoaderData } from "react-router";
import { RiAddCircleFill } from "react-icons/ri";
import { LinkButton } from "~/components/Button";
import { LinkOverlay } from "~/components/LinkOverlay";
import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import type { Route } from "./+types/tracks._index";

export const meta: Route.MetaFunction = () => {
  return [
    { title: `RC Drift UK | Tracks` },
    {
      name: "description",
      content: "Here you can find a list of all the tracks from across the UK.",
    },
  ];
};

export const loader = async () => {
  const tracks = await prisma.tracks.findMany({
    orderBy: {
      name: "asc",
    },
    where: {
      status: TrackStatus.ACTIVE,
    },
  });

  return tracks;
};

const TracksPage = () => {
  const tracks = useLoaderData<typeof loader>();

  return (
    <styled.main overflow="hidden">
      <Box borderBottomWidth={1} borderColor="gray.900">
        <Container px={4} py={8} maxW={1100}>
          <Flex
            alignItems={{ base: "stretch", md: "flex-start" }}
            flexDir={{ base: "column", md: "row" }}
            gap={2}
          >
            <Box>
              <styled.h1 fontSize="4xl" fontWeight="extrabold" lineHeight={1.2}>
                Tracks
              </styled.h1>
              <styled.p color="gray.400" maxW={400}>
                Here you can find a list of all the tracks, clubs and shops from
                across the UK.
              </styled.p>
            </Box>

            <Spacer />
            <SignedIn>
              <LinkButton to="/tracks/new" variant="outline">
                Register a new Track <RiAddCircleFill />
              </LinkButton>
            </SignedIn>
          </Flex>
        </Container>
      </Box>

      <Container px={4} py={8} maxW={1100}>
        <Flex flexWrap="wrap" gap={4} mr={-4}>
          {tracks.map((track) => {
            return (
              <styled.article
                overflow="hidden"
                key={track.id}
                pos="relative"
                rounded="xl"
                bgColor="gray.900"
                py={8}
                px={2}
                w={{
                  base: "calc(50% - var(--spacing-4))",
                  md: "calc(25% - var(--spacing-4))",
                }}
                display="flex"
                justifyContent="center"
                flexDir="column"
                zIndex={1}
                borderWidth={1}
                borderColor="gray.800"
              >
                <Box pos="absolute" inset={0} zIndex={-1}>
                  <styled.img
                    src={track.image}
                    w="full"
                    h="full"
                    objectFit="cover"
                  />
                  <Box
                    pos="absolute"
                    inset={0}
                    bgGradient="to-b"
                    gradientFrom="rgba(24, 24, 27, 0.9)"
                    gradientTo="gray.900"
                  />
                </Box>
                <Box
                  w={24}
                  h={24}
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

                <LinkOverlay to={`/tracks/${track.slug}`}>
                  <styled.span
                    textWrap="balance"
                    whiteSpace="pre-line"
                    fontWeight="bold"
                    textAlign="center"
                    display="block"
                    fontSize={{ base: "md", md: "lg" }}
                    lineHeight={1.1}
                    mb={1}
                  >
                    {track.name}
                  </styled.span>
                </LinkOverlay>

                <styled.p
                  color="gray.500"
                  fontSize="sm"
                  w="full"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  textAlign="center"
                >
                  {track.description}
                </styled.p>
              </styled.article>
            );
          })}
        </Flex>
      </Container>
    </styled.main>
  );
};

export default TracksPage;
