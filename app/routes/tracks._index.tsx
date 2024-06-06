import type { MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { LinkOverlay } from "~/components/LinkOverlay";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export const meta: MetaFunction = () => {
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
  });

  return tracks;
};

const TracksPage = () => {
  const tracks = useLoaderData<typeof loader>();

  return (
    <styled.main py={6} overflow="hidden">
      <styled.h1 fontSize="4xl" fontWeight="extrabold" lineHeight={1.2}>
        Tracks
      </styled.h1>
      <styled.p color="gray.400" mb={8}>
        Here you can find a list of all the tracks, clubs and shops from across
        the UK.
      </styled.p>

      <Flex flexWrap="wrap" gap={4} mr={-4}>
        {tracks.map((track) => {
          return (
            <styled.article
              overflow="hidden"
              key={track.id}
              pos="relative"
              rounded="lg"
              bgColor="gray.900"
              p={8}
              w={{
                base: "calc(50% - var(--spacing-4))",
                md: "calc(25% - var(--spacing-4))",
              }}
              display="flex"
              justifyContent="center"
              flexDir="column"
            >
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

              <LinkOverlay
                to={`/tracks/${track.slug}`}
                textWrap="balance"
                fontWeight="semibold"
                textAlign="center"
              >
                {track.name}
              </LinkOverlay>
            </styled.article>
          );
        })}
      </Flex>
    </styled.main>
  );
};

export default TracksPage;
