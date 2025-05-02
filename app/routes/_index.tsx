import { Regions, TrackStatus } from "@prisma/client";
import type { MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { endOfDay, format, startOfDay } from "date-fns";
import {
  RiArrowRightLine,
  RiCalendarLine,
  RiListOrdered2,
  RiMapPin2Fill,
  RiRocketLine,
  RiTrophyLine,
} from "react-icons/ri";
import { LinkButton } from "~/components/Button";
import { EventCard } from "~/components/EventCard";
import { Glow } from "~/components/Glow";
import { ImageContainer } from "~/components/ImageContainer";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { getDriverRank } from "~/utils/getDriverRank";
import { getDriverRatings } from "~/utils/getDriverRatings";
import { prisma } from "~/utils/prisma.server";

const Card = styled("article", {
  base: {
    rounded: "lg",
    borderWidth: 1,
    borderColor: "gray.800",
    p: 4,
    bgColor: "gray.950",
    shadow: "2xl",
  },
});

export const loader = async () => {
  const today = new Date();
  const events = await prisma.events.findMany({
    where: {
      startDate: {
        gte: startOfDay(today),
        lte: endOfDay(today),
      },
      eventTrack: {
        status: TrackStatus.ACTIVE,
      },
    },
    include: {
      eventTrack: true,
    },
    orderBy: [
      {
        startDate: "asc",
      },
    ],
  });

  const drivers = await getDriverRatings(Regions.ALL, 10);

  return { events, drivers };
};

export const meta: MetaFunction = () => {
  return [
    { title: "RC Drift UK | Home" },
    { name: "description", content: "Welcome to RCDrift.uk" },
    {
      property: "og:image",
      content: "https://rcdrift.uk/rcdriftuk-logo.jpg",
    },
  ];
};

const Page = () => {
  const { events, drivers } = useLoaderData<typeof loader>();
  const today = format(new Date(), "dd-MM-yy");

  return (
    <>
      <Box pos="relative" zIndex={1} w="full" overflow="hidden">
        <Box
          pos="absolute"
          top={0}
          left="50%"
          transform="translateX(-50%)"
          w={{ base: "150%", md: "full" }}
          zIndex={-1}
          _after={{
            content: '""',
            pos: "absolute",
            inset: 0,
            bgGradient: "to-b",
            gradientFrom: "transparent",
            gradientTo: "black",
            zIndex: 1,
          }}
        >
          <styled.img src="/bg.png" w="full" alt="background" />
        </Box>
        <Container
          textAlign="center"
          maxW={1100}
          py={{ base: 12, md: 100 }}
          px={6}
        >
          <Box pos="relative" mx="auto" w="fit-content" rounded="full">
            <Link to="/2025">
              <styled.span
                borderWidth={1}
                borderColor="brand.800"
                rounded="full"
                px={4}
                py={1}
                bgGradient="to-b"
                gradientTo="transparent"
                gradientFrom="brand.900"
                fontWeight="medium"
                fontSize="sm"
                display="inline-flex"
                alignItems="center"
                gap={2}
                shadow="0 6px 24px rgba(242, 12, 78, 0.4)"
              >
                <RiTrophyLine />
                RC Drift UK 2025
                <RiArrowRightLine />
              </styled.span>
            </Link>
            <Glow size="sm" />
          </Box>

          <styled.h1
            mt={4}
            fontWeight="medium"
            fontSize={{ base: "5xl", md: "6xl" }}
            lineHeight={1.1}
            textWrap="balance"
            maxW={700}
            mx="auto"
            bgClip="text"
            bgGradient="to-br"
            gradientFrom="white"
            gradientTo="gray.400"
            color="transparent"
          >
            The{" "}
            <styled.span display={{ base: "none", sm: "inline" }}>
              complete{" "}
            </styled.span>
            platform for RC Drifting.
          </styled.h1>
          <styled.p
            color="gray.400"
            pt={3}
            pb={12}
            fontSize="lg"
            maxW={600}
            mx="auto"
            textWrap="balance"
          >
            We're empowering the RC drift community with powerful tools, major
            events, beginner guides, and our innovative driver ratings.
          </styled.p>

          <Flex
            gap={4}
            justify="center"
            flexDir={{ base: "column", sm: "row" }}
          >
            <LinkButton to="/getting-started">
              <RiRocketLine /> Getting Started
            </LinkButton>
            <LinkButton to="/map/all" variant="secondary">
              <RiMapPin2Fill /> Find Your Local Track
            </LinkButton>
          </Flex>
        </Container>

        <Container maxW={1100} px={2}>
          <Flex gap={4} flexDir={{ base: "column", md: "row" }}>
            <Card flex={1}>
              <Flex align="center" gap={2} mb={2}>
                <RiCalendarLine />
                <styled.h1 fontWeight="bold" fontSize="lg">
                  Today's Events
                </styled.h1>
              </Flex>

              <Flex gap={2} flexDir="column">
                {events.length <= 0 && (
                  <styled.p mb={4}>There are no events on today.</styled.p>
                )}

                {events.map((event) => {
                  return <EventCard key={event.id} event={event} showAvatar />;
                })}

                <LinkButton to={`/calendar/week/${today}`} variant="secondary">
                  See All Events
                </LinkButton>
              </Flex>
            </Card>

            <Card
              flex={1}
              bgGradient="to-b"
              gradientFrom="gray.900"
              gradientTo="black"
            >
              <Flex align="center" gap={2} mb={2}>
                <RiListOrdered2 />
                <styled.h1 fontWeight="bold" fontSize="lg">
                  Top Driver Ratings
                </styled.h1>
              </Flex>

              <styled.table w="full">
                <styled.tbody>
                  {drivers.map((driver, i) => (
                    <styled.tr key={driver.id}>
                      <styled.td textAlign="center" fontFamily="mono">
                        {i + 1}
                      </styled.td>
                      <styled.td px={1}>
                        <Link to={`/ratings/${driver.driverId}`}>
                          {driver.firstName} {driver.lastName}
                        </Link>
                      </styled.td>
                      <styled.td textAlign="right" fontFamily="mono">
                        {driver.elo.toFixed(3)}
                      </styled.td>
                      <styled.td textAlign="center">
                        <styled.img
                          w={8}
                          display="inline-block"
                          src={`/badges/${getDriverRank(
                            driver.elo,
                            driver.totalBattles
                          )}.png`}
                          alt={`${driver.firstName} ${driver.lastName}'s rank badge`}
                        />
                      </styled.td>
                    </styled.tr>
                  ))}
                </styled.tbody>
              </styled.table>

              <LinkButton to="/ratings" variant="secondary" w="full" mt={4}>
                See All Driver Ratings
              </LinkButton>
            </Card>
          </Flex>
        </Container>
      </Box>

      <Container px={2} maxW={1100}>
        <Link to="/2025">
          <ImageContainer maxW="full" mb={8}>
            <styled.img src="/2025-cover.jpg" w="full" />
          </ImageContainer>
        </Link>
      </Container>
    </>
  );
};

export default Page;
