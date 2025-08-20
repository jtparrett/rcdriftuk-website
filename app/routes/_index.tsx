import { Regions, TrackStatus } from "~/utils/enums";
import type { Route } from "./+types/_index";
import { Link, useLoaderData } from "react-router";
import { endOfDay, format, startOfDay } from "date-fns";
import {
  RiAddCircleFill,
  RiArrowRightLine,
  RiCalendarLine,
  RiCodeLine,
  RiListOrdered2,
  RiMapPin2Line,
  RiRocketLine,
  RiStockLine,
  RiTrophyLine,
  RiUserLine,
} from "react-icons/ri";
import { LinkButton } from "~/components/Button";
import { EventCard } from "~/components/EventCard";
import { Glow } from "~/components/Glow";
import {
  Box,
  Center,
  Container,
  Flex,
  Spacer,
  styled,
} from "~/styled-system/jsx";
import { getDriverRank } from "~/utils/getDriverRank";
import { getDriverRatings } from "~/utils/getDriverRatings.server";
import { prisma } from "~/utils/prisma.server";
import { motion } from "motion/react";
import { css } from "~/styled-system/css";
import { SignedIn, SignedOut } from "@clerk/react-router";
import { MockPhone } from "~/components/MockPhone";
import { DashedLine } from "~/components/DashedLine";

const Card = styled("article", {
  base: {
    rounded: "xl",
    borderWidth: 1,
    borderColor: "gray.800",
    p: 4,
    bgColor: "gray.950",
    bgGradient: "to-b",
    gradientFrom: "gray.900",
    gradientTo: "black",
  },
});

const IconBox = styled("div", {
  base: {
    rounded: "full",
    bgColor: "brand.500",
    p: 2,
    w: 8,
    h: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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

export const meta: Route.MetaFunction = () => {
  return [
    { title: "RC Drift UK | Home" },
    { name: "description", content: "Welcome to RCDrift.uk" },
    {
      property: "og:image",
      content: "https://rcdrift.uk/og-image.jpg",
    },
  ];
};

const Intro = ({ number, title }: { number: string; title: string }) => {
  return (
    <>
      <Box py={4} px={12} mx={-8} borderTopWidth={1} borderColor="gray.800">
        <Flex
          fontWeight="semibold"
          fontSize="sm"
          color="gray.500"
          textTransform="uppercase"
          alignItems="center"
          gap={1}
        >
          <styled.span color="gray.300" display="block">
            [{number}]
          </styled.span>
          <styled.h1>{title}</styled.h1>
        </Flex>
      </Box>
      <DashedLine />
    </>
  );
};

const Page = () => {
  const { events, drivers } = useLoaderData<typeof loader>();
  const today = format(new Date(), "dd-MM-yy");

  return (
    <Box pos="relative" zIndex={1} w="full" overflow="hidden">
      <Box
        w="full"
        bgImage="url(/bg.png)"
        bgSize={{ base: "240%", md: "130%" }}
        bgPosition="center"
        bgRepeat="no-repeat"
        pos="relative"
        zIndex={0}
        _after={{
          content: '""',
          pos: "absolute",
          inset: 0,
          bgGradient: "to-b",
          gradientFrom: "transparent",
          gradientTo: "black",
          zIndex: -1,
        }}
      >
        <Container
          textAlign="center"
          maxW={1100}
          py={12}
          minH="75dvh"
          px={2}
          display="flex"
          alignItems="center"
        >
          <Box w="fit-content" mx="auto">
            <Box pos="relative" mx="auto" w="fit-content" rounded="full">
              <Link to="/2025">
                <styled.span
                  borderWidth={1}
                  borderColor="brand.800"
                  rounded="full"
                  px={4}
                  py={2}
                  bgColor="brand.900"
                  fontWeight="medium"
                  fontSize="sm"
                  display="inline-flex"
                  alignItems="center"
                  gap={2}
                  shadow="0 6px 24px rgba(242, 12, 78, 0.3), inset 0 0 8px rgba(255, 255, 255, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.2)"
                >
                  <RiTrophyLine />
                  RC Drift UK 2025
                  <RiArrowRightLine />
                </styled.span>
              </Link>
              <Glow size="sm" />
            </Box>

            <motion.h1
              className={css({
                mt: 4,
                fontWeight: "medium",
                fontSize: { base: "5xl", md: "8xl" },
                lineHeight: 1.1,
                textWrap: "balance",
                maxW: 700,
                mx: "auto",
                bgClip: "text",
                bgGradient: "to-br",
                gradientFrom: "white",
                gradientTo: "gray.400",
                color: "transparent",
                letterSpacing: "tight",
              })}
              initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5 }}
            >
              Driving the Future
              <br /> of RC Drifting
            </motion.h1>
            <motion.p
              className={css({
                color: "gray.400",
                pt: 3,
                pb: 12,
                fontSize: "lg",
                maxW: 600,
                mx: "auto",
                textWrap: "balance",
              })}
              initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              We're empowering the Radio-Controlled Drifting community with
              powerful tools, major events, beginner guides, and innovative
              driver analytics.
            </motion.p>

            <Flex
              gap={4}
              justify="center"
              flexDir={{ base: "column", sm: "row" }}
              px={6}
              mx="auto"
            >
              <SignedOut>
                <LinkButton to="/getting-started">
                  <RiRocketLine /> Getting Started Guide
                </LinkButton>
              </SignedOut>
              <SignedIn>
                <LinkButton to="/drivers/me">
                  <RiUserLine />
                  View My Driver Profile
                </LinkButton>
              </SignedIn>
              <LinkButton to="/map/all" variant="secondary">
                <RiMapPin2Line /> Find My Local Track
              </LinkButton>
            </Flex>
          </Box>
        </Container>
      </Box>

      <Box
        bgGradient="to-b"
        gradientFrom="black"
        gradientVia="rgba(255, 255, 255, 0.03)"
        gradientTo="black"
      >
        <Box px={2}>
          <Box
            pt={8}
            borderLeftWidth={1}
            borderRightWidth={1}
            borderColor="gray.800"
            maxW={1100}
            mx="auto"
          >
            <styled.section>
              <Container maxW={1100} px={0}>
                <Intro number="01" title="Our Partners" />
                <Flex gap={4} py={12} px={4} justify="space-around">
                  {[
                    ["zerofeel", "https://zerofeel.co.uk"],
                    ["rcdn", "https://rc-driftnetwork.com/"],
                    ["dm", "https://www.instagram.com/damnmillennials.rc"],
                  ].map(([partner, url]) => (
                    <Box
                      w={{ base: "100px", md: "120px" }}
                      h={12}
                      key={partner}
                      pos="relative"
                      opacity={0.5}
                      _hover={{
                        md: {
                          opacity: 1,
                        },
                      }}
                      transition="opacity 0.2s ease-in-out"
                    >
                      <Link to={url} target="_blank">
                        <styled.img
                          src={`/${partner}.png`}
                          w="full"
                          h="full"
                          objectFit="contain"
                          alt={`${partner} logo`}
                        />
                        <styled.span srOnly>{partner}</styled.span>
                      </Link>
                    </Box>
                  ))}
                </Flex>
              </Container>
            </styled.section>

            <styled.section>
              <Container maxW={1100} px={0}>
                <Intro number="02" title="Innovative Tools" />

                <Flex gap={2} flexDir={{ base: "column", md: "row" }} p={2}>
                  <Card p={0} flex={1}>
                    <Flex
                      align="center"
                      px={{ base: 8, md: 12 }}
                      gap={{ base: 4, md: 12 }}
                      flexDir={{ base: "column-reverse", md: "row" }}
                    >
                      <MockPhone src="/home/driver-profile.jpg" />

                      <Box flex={1} py={8}>
                        <IconBox mb={2}>
                          <RiStockLine size={16} />
                        </IconBox>
                        <styled.h1 fontWeight="semibold" fontSize="3xl" mb={1}>
                          Driver Analytics
                        </styled.h1>
                        <styled.p color="gray.400" textWrap="balance">
                          Track your rank with real-time driver ratings. From
                          grassroots events to pro-level tournaments.
                        </styled.p>
                        <LinkButton
                          to="/ratings/all"
                          variant="secondary"
                          mt={4}
                        >
                          See All Driver Ratings
                          <RiArrowRightLine />
                        </LinkButton>
                      </Box>
                    </Flex>
                  </Card>

                  <Card
                    bgColor="gray.900"
                    overflow="hidden"
                    py={12}
                    w={{ base: "full", md: "30%" }}
                    flex="none"
                    display="flex"
                    flexDir="column"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Box textAlign="center">
                      <IconBox mb={2} mx="auto">
                        <RiMapPin2Line size={16} />
                      </IconBox>
                      <styled.h1 fontWeight="semibold" fontSize="3xl" mb={1}>
                        200+ Tracks
                      </styled.h1>
                      <styled.p color="gray.400" textWrap="balance">
                        Find your local track with our global Drift Map.
                      </styled.p>
                      <LinkButton to="/map/all" variant="secondary" mt={4}>
                        View The Map
                        <RiArrowRightLine />
                      </LinkButton>
                    </Box>
                  </Card>
                </Flex>

                <Flex
                  gap={2}
                  flexDir={{ base: "column-reverse", md: "row" }}
                  px={2}
                  pb={2}
                >
                  <Card
                    bgColor="gray.900"
                    overflow="hidden"
                    py={12}
                    w={{ base: "full", md: "30%" }}
                    flex="none"
                    display="flex"
                    flexDir="column"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Box textAlign="center">
                      <IconBox mb={2} mx="auto">
                        <RiCalendarLine size={16} />
                      </IconBox>
                      <styled.h1 fontWeight="semibold" fontSize="3xl" mb={1}>
                        1.5K Events
                      </styled.h1>
                      <styled.p color="gray.400" textWrap="balance">
                        Plan your next drift day with our packed-out calendar.
                      </styled.p>
                      <LinkButton to="/calendar" variant="secondary" mt={4}>
                        View The Calendar
                        <RiArrowRightLine />
                      </LinkButton>
                    </Box>
                  </Card>

                  <Box flex={1}>
                    <Card p={0} overflow="hidden">
                      <Flex
                        align="center"
                        px={{ base: 8, md: 12 }}
                        gap={{ base: 4, md: 12 }}
                        flexDir={{ base: "column-reverse", md: "row" }}
                      >
                        <MockPhone src="/home/tournament-battles.jpg" />

                        <Box flex={1} py={8}>
                          <IconBox mb={2}>
                            <RiCodeLine size={16} />
                          </IconBox>
                          <styled.h1
                            fontWeight="semibold"
                            fontSize="3xl"
                            mb={1}
                          >
                            Beskpoke Software
                          </styled.h1>
                          <styled.p color="gray.400" textWrap="balance">
                            Host your own RC Drift tournaments with our free
                            online software.
                          </styled.p>
                          <LinkButton to="/tournaments/new" mt={4}>
                            Create a Tournament
                            <RiAddCircleFill />
                          </LinkButton>
                        </Box>
                      </Flex>
                    </Card>
                  </Box>
                </Flex>
              </Container>
            </styled.section>
          </Box>
        </Box>
      </Box>

      <Box
        px={2}
        bgGradient="to-b"
        gradientFrom="black"
        gradientTo="rgba(255, 255, 255, 0.02)"
      >
        <Box
          borderLeftWidth={1}
          borderRightWidth={1}
          borderColor="gray.800"
          maxW={1100}
          mx="auto"
        >
          <styled.section>
            <Container maxW={1100} px={0}>
              <Intro number="03" title="For the Professionals" />
              <Box
                bgImage="url(/main-event-bg.jpg)"
                bgSize="cover"
                bgPosition="center"
                bgRepeat="no-repeat"
                rounded="xl"
                overflow="hidden"
                pos="relative"
                m={2}
                _after={{
                  content: '""',
                  pos: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  shadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
                  rounded: "inherit",
                }}
              >
                <Flex
                  flexDir={{ base: "column", md: "row" }}
                  bgColor={{
                    base: "rgba(0, 0, 0, 0.8)",
                    md: "rgba(0, 0, 0, 0.6)",
                  }}
                >
                  <Spacer />
                  <Box textAlign="center" flex={1} py={32}>
                    <Center
                      w={14}
                      h={14}
                      rounded="full"
                      bgColor="brand.500"
                      mx="auto"
                      mb={4}
                    >
                      <RiTrophyLine size={26} />
                    </Center>
                    <styled.h1
                      fontWeight="extrabold"
                      fontSize={{ base: "4xl", md: "5xl" }}
                      letterSpacing="tight"
                      lineHeight={1.1}
                    >
                      RC Drift UK 2025
                    </styled.h1>
                    <styled.p textWrap="balance" mb={4}>
                      The UK's professional RC Drifting Series.
                    </styled.p>
                    <LinkButton to="/2025" variant="secondary" mb={4}>
                      Learn More
                      <RiArrowRightLine />
                    </LinkButton>
                  </Box>
                </Flex>
              </Box>
            </Container>
          </styled.section>

          <styled.section>
            <Container maxW={1100} px={0}>
              <Intro number="04" title="Our Community" />
              <Flex
                gap={2}
                flexDir={{ base: "column-reverse", md: "row" }}
                p={2}
              >
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
                      return (
                        <EventCard key={event.id} event={event} showAvatar />
                      );
                    })}

                    <LinkButton
                      to={`/calendar/week/${today}`}
                      variant="secondary"
                    >
                      See All Events
                    </LinkButton>
                  </Flex>
                </Card>

                <Card flex={1}>
                  <Flex align="center" gap={2} mb={2}>
                    <RiListOrdered2 />
                    <styled.h1 fontWeight="bold" fontSize="lg">
                      Top Driver Ratings
                    </styled.h1>
                  </Flex>

                  <styled.table w="full">
                    <styled.tbody>
                      {drivers.map((driver, i) => (
                        <styled.tr key={i}>
                          <styled.td textAlign="center" fontFamily="mono">
                            {i + 1}
                          </styled.td>
                          <styled.td px={1}>
                            <Link to={`/drivers/${driver.driverId}`}>
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
                                driver.totalBattles,
                              )}.png`}
                              alt={`${driver.firstName} ${driver.lastName}'s rank badge`}
                            />
                          </styled.td>
                        </styled.tr>
                      ))}
                    </styled.tbody>
                  </styled.table>

                  <LinkButton
                    to="/ratings/all"
                    variant="secondary"
                    w="full"
                    mt={4}
                  >
                    See All Driver Ratings
                  </LinkButton>
                </Card>
              </Flex>
            </Container>
          </styled.section>
        </Box>
      </Box>
    </Box>
  );
};

export default Page;
