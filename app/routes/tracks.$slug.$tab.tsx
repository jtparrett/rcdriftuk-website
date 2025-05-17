import { TrackTypes } from "~/utils/enums";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { startOfDay } from "date-fns";
import pluralize from "pluralize";
import {
  RiAddCircleFill,
  RiEditCircleFill,
  RiFacebookCircleFill,
  RiLink,
  RiStoreFill,
} from "react-icons/ri";
import { z } from "zod";
import { LinkButton } from "~/components/Button";
import { EventCard } from "~/components/EventCard";
import { ProductCard } from "~/components/ProductCard";
import { Tab } from "~/components/Tab";
import { styled, Box, Flex, Container, Grid } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import type { Route } from "./+types/tracks.$slug.$tab";
import { TrackSnippet } from "~/components/TrackSnippet";
import notFoundInvariant from "~/utils/notFoundInvariant";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const slug = z.string().parse(params.slug);
  const { userId } = await getAuth(args);
  const tab = z.enum(["events", "feed", "products"]).parse(params.tab);

  if (tab === "events") {
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

    notFoundInvariant(track);

    return { track, tab };
  }

  if (tab === "feed") {
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

    return { track, tab };
  }

  if (tab === "products") {
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
        Products: {
          take: 20,
          orderBy: {
            title: "asc",
          },
          include: {
            Tracks: true,
          },
        },
      },
    });

    notFoundInvariant(track);

    return { track, tab };
  }

  throw new Response(null, {
    status: 404,
    statusText: "Not Found",
  });
};

export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: `RC Drift UK | Tracks | ${data?.track?.name}` },
    { name: "description", content: data?.track?.description },
    {
      property: "og:image",
      content: `https://rcdrift.uk/${data?.track?.image}`,
    },
  ];
};

const TrackPage = () => {
  const data = useLoaderData<typeof loader>();
  const isOwner = (data?.track?.Owners.length ?? 0) > 0;
  const nextEvent = data?.tab === "events" ? data?.track?.events[0] : null;

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
            <TrackSnippet track={data.track} />

            <Box p={4}>
              <LinkButton
                w="full"
                to={data?.track?.url}
                variant="outline"
                target="_blank"
                size="sm"
              >
                {data?.track?.url.includes("facebook")
                  ? "Visit Facebook"
                  : data?.track?.types.includes(TrackTypes.SHOPS)
                    ? "Shop Now"
                    : "Visit Website"}
                {data?.track?.url.includes("facebook") ? (
                  <RiFacebookCircleFill />
                ) : data?.track?.types.includes(TrackTypes.SHOPS) ? (
                  <RiStoreFill />
                ) : (
                  <RiLink />
                )}
              </LinkButton>
            </Box>

            {isOwner && (
              <Box p={4} borderTopWidth={1} borderColor="gray.800">
                <LinkButton
                  variant="outline"
                  w="full"
                  mb={2}
                  size="sm"
                  to={`/tracks/${data?.track?.slug}/edit`}
                >
                  Edit Track <RiEditCircleFill />
                </LinkButton>
                <LinkButton
                  variant="outline"
                  w="full"
                  size="sm"
                  mb={2}
                  to={`/tracks/${data?.track?.slug}/events/new`}
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
            gap={2}
          >
            <Tab
              to={`/tracks/${data?.track?.slug}/events`}
              isActive={data?.tab === "events"}
            >
              Events
            </Tab>
            <Tab
              to={`/tracks/${data?.track?.slug}/feed`}
              isActive={data?.tab === "feed"}
            >
              Feed
            </Tab>
            {data?.track?.types.includes(TrackTypes.SHOPS) && (
              <Tab
                to={`/tracks/${data?.track?.slug}/products`}
                isActive={data?.tab === "products"}
              >
                Products
              </Tab>
            )}
          </Flex>

          <Box
            rounded="xl"
            overflow="hidden"
            borderWidth={1}
            borderColor="gray.800"
          >
            <Grid
              gridTemplateColumns={
                data?.tab === "products"
                  ? { base: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }
                  : "1fr"
              }
              gap={2}
              p={4}
            >
              {data?.tab === "events" && (
                <>
                  {data?.track?.events.length > 0 && nextEvent && (
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

                  {(data?.track?.events.length ?? 0) <= 0 && (
                    <styled.p>No events here yet...</styled.p>
                  )}

                  {data?.track?.events
                    .slice(1)
                    .map((event) => <EventCard event={event} key={event.id} />)}
                </>
              )}

              {data?.tab === "feed" && (
                <styled.p>No posts here yet...</styled.p>
              )}

              {data?.tab === "products" && (
                <>
                  {(data?.track?.Products.length ?? 0) <= 0 && (
                    <styled.p>No products here yet...</styled.p>
                  )}

                  {data?.track?.Products.map((product) => (
                    <ProductCard product={product} key={product.slug} />
                  ))}
                </>
              )}
            </Grid>
          </Box>
        </Box>
      </Flex>
    </Container>
  );
};

export default TrackPage;
