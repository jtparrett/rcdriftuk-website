import { TrackTypes } from "~/utils/enums";
import type { LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useLocation } from "react-router";
import {
  RiAddCircleFill,
  RiEditCircleFill,
  RiFacebookCircleFill,
  RiLink,
  RiStoreFill,
} from "react-icons/ri";
import { z } from "zod";
import { LinkButton } from "~/components/Button";
import { Tab } from "~/components/Tab";
import { Box, Flex, Container } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import type { Route } from "./+types/tracks.$slug";
import { TrackSnippet } from "~/components/TrackSnippet";
import notFoundInvariant from "~/utils/notFoundInvariant";

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
    },
  });

  notFoundInvariant(track);

  return track;
};

export const meta: Route.MetaFunction = ({ data }) => {
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
  const isOwner = (track?.Owners.length ?? 0) > 0;
  const location = useLocation();
  const tab = location.pathname.split("/").pop();

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
            <TrackSnippet track={track} />

            <Box p={4}>
              <LinkButton
                w="full"
                to={track?.url}
                variant="outline"
                target="_blank"
                size="sm"
              >
                {track?.url.includes("facebook")
                  ? "Visit Facebook"
                  : track?.types.includes(TrackTypes.SHOPS)
                    ? "Shop Now"
                    : "Visit Website"}
                {track?.url.includes("facebook") ? (
                  <RiFacebookCircleFill />
                ) : track?.types.includes(TrackTypes.SHOPS) ? (
                  <RiStoreFill />
                ) : (
                  <RiLink />
                )}
              </LinkButton>
              <LinkButton
                w="full"
                mt={2}
                to={`https://www.google.com/maps?q=${track.address ?? `${track.lat},${track.lng}`}`}
                variant="outline"
                target="_blank"
                size="sm"
              >
                Open in Google Maps
              </LinkButton>
            </Box>

            {isOwner && (
              <Box p={4} borderTopWidth={1} borderColor="gray.800">
                <LinkButton
                  variant="outline"
                  w="full"
                  mb={2}
                  size="sm"
                  to={`/edit/track/${track?.slug}`}
                >
                  Edit Track <RiEditCircleFill />
                </LinkButton>
                <LinkButton
                  variant="outline"
                  w="full"
                  size="sm"
                  to={`/create/event/${track?.slug}`}
                >
                  Create Event <RiAddCircleFill />
                </LinkButton>
              </Box>
            )}
          </Box>
        </Box>

        <Box flex={1}>
          <Flex
            p={2}
            borderWidth={1}
            borderColor="gray.800"
            rounded="xl"
            mb={2}
            gap={0.5}
            overflowX="auto"
          >
            <Tab
              to={`/tracks/${track?.slug}/events`}
              isActive={tab === "events"}
              replace
            >
              Events
            </Tab>
            <Tab
              to={`/tracks/${track?.slug}/posts`}
              isActive={tab === "posts"}
              replace
            >
              Posts
            </Tab>
            {track?.types.includes(TrackTypes.SHOPS) && (
              <Tab
                to={`/tracks/${track?.slug}/products`}
                isActive={tab === "products"}
                replace
              >
                Products
              </Tab>
            )}
            <Tab
              to={`/tracks/${track?.slug}/leaderboard`}
              isActive={tab === "leaderboard"}
              replace
            >
              Leaderboard
            </Tab>
          </Flex>

          <Box
            rounded="xl"
            overflow="hidden"
            borderWidth={1}
            borderColor="gray.800"
          >
            <Outlet />
          </Box>
        </Box>
      </Flex>
    </Container>
  );
};

export default TrackPage;
