import type { MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { endOfDay, format, startOfDay } from "date-fns";
import { RiArrowRightLine, RiMapPin2Fill, RiRocket2Line } from "react-icons/ri";
import { LinkButton } from "~/components/Button";
import { EventCard } from "~/components/EventCard";
import { ImageContainer } from "~/components/ImageContainer";
import { LinkOverlay } from "~/components/LinkOverlay";
import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
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
      approved: true,
      startDate: {
        gte: startOfDay(today),
        lte: endOfDay(today),
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

  const drivers = (await getDriverRatings()).slice(0, 10);

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
      <Box
        bgImage="url(/grid-bg.svg)"
        bgRepeat="repeat"
        bgSize="60px"
        bgPosition="center"
        pos="relative"
        zIndex={1}
        _after={{
          content: '""',
          display: "block",
          pos: "absolute",
          inset: 0,
          bgGradient: "to-b",
          gradientFrom: "transparent",
          gradientVia: "transparent",
          gradientTo: "black",
          zIndex: -1,
        }}
      >
        <Container maxW={650} textAlign="center" py={100}>
          <styled.h1
            fontWeight="black"
            textTransform="uppercase"
            fontSize={{ base: "4xl", md: "6xl" }}
            lineHeight={1}
            textWrap="balance"
          >
            The home of UK RC Drifting 🇬🇧
          </styled.h1>
          <styled.p
            textWrap="balance"
            color="gray.400"
            pt={4}
            pb={8}
            fontSize="lg"
          >
            Everything RC Drift from across the UK. Tracks, Clubs, Shops, Driver
            Ratings and more.
          </styled.p>

          <Flex
            gap={4}
            justify="center"
            flexDir={{ base: "column", sm: "row" }}
          >
            <LinkButton to="/getting-started">
              <RiRocket2Line /> Getting Started
            </LinkButton>
            <LinkButton to="/map/all" variant="secondary">
              <RiMapPin2Fill /> Find Your Local Track
            </LinkButton>
          </Flex>
        </Container>

        <Container maxW={1100} px={2} mb={4}>
          <Box
            p={1}
            bgGradient="to-br"
            gradientFrom="brand.500"
            gradientTo="brand.700"
            rounded="xl"
            pos="relative"
            overflow="hidden"
          >
            <LinkOverlay to="/2025" />
            <Flex
              rounded="lg"
              borderWidth={1}
              borderColor="brand.700"
              px={4}
              py={3}
              alignItems="center"
              gap={4}
              shadow="inset 0 1px 0 rgba(255, 255, 255, 0.2)"
            >
              <styled.img src="/2025/2025-logo.png" w="60px" />
              <styled.h2
                textTransform="uppercase"
                fontWeight="black"
                fontStyle="italic"
                fontSize={{ base: "xl", md: "2xl" }}
              >
                Learn more about RC Drift.uk 2025
              </styled.h2>

              <Spacer />

              <styled.span fontSize="2xl">
                <RiArrowRightLine />
              </styled.span>
            </Flex>
          </Box>
        </Container>

        <Container maxW={1100} px={2}>
          <Flex gap={4} flexDir={{ base: "column", md: "row" }}>
            <Card flex={1}>
              <styled.h1 fontWeight="bold" fontSize="lg" mb={2}>
                Today
              </styled.h1>

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

            <Card flex={1}>
              <styled.h1 fontWeight="bold" fontSize="lg" mb={2}>
                Top Driver Ratings
              </styled.h1>

              <styled.table w="full">
                <styled.thead>
                  <styled.tr>
                    <styled.th textAlign="left" w="full" p={1}>
                      Name
                    </styled.th>
                    <styled.th textAlign="right" p={1}>
                      Points
                    </styled.th>
                    <styled.th textAlign="right" p={1}>
                      Rank
                    </styled.th>
                  </styled.tr>
                </styled.thead>
                <styled.tbody>
                  {drivers.map((driver, i) => (
                    <styled.tr key={driver.id}>
                      <styled.td px={1}>
                        #{i + 1} {driver.firstName} {driver.lastName}
                      </styled.td>
                      <styled.td textAlign="right" px={1}>
                        {driver.currentElo.toFixed(3)}
                      </styled.td>
                      <styled.td textAlign="center" px={1}>
                        <styled.img
                          w={8}
                          display="inline-block"
                          src={`/badges/${getDriverRank(
                            driver.currentElo,
                            driver.history.length
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
