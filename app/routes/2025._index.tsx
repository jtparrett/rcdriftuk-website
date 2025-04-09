import { styled, Container, Box, Flex, Divider } from "~/styled-system/jsx";
import { LinkButton } from "~/components/Button";
import {
  RiMapPin2Fill,
  RiArrowDownSLine,
  RiCalendar2Fill,
  RiArrowRightLine,
  RiTicketFill,
} from "react-icons/ri";
import { useDisclosure } from "~/utils/useDisclosure";
import type { MetaFunction } from "@remix-run/node";
import { ImageContainer } from "~/components/ImageContainer";
import { Glow } from "~/components/Glow";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "RC Drift UK | 2025" },
    {
      name: "description",
      content: "Welcome to RCDrift.uk 2025",
    },
    {
      property: "og:image",
      content: "https://rcdrift.uk/2025-cover.jpg",
    },
  ];
};

const H1 = styled("h1", {
  base: {
    fontSize: "4xl",
    fontWeight: "black",
    textWrap: "balance",
  },
});

const H2 = styled("h2", {
  base: {
    fontSize: {
      base: "xl",
      md: "2xl",
    },
    fontWeight: "black",
    textWrap: "balance",
  },
});

const H3 = styled("h3", {
  base: {
    mt: 4,
    mb: 2,
    color: "gray.200",
    fontSize: {
      base: "lg",
      md: "xl",
    },
    fontWeight: "black",
    textWrap: "balance",
  },
});

const P = styled("p", {
  base: {
    color: "gray.400",
    marginTop: 2,
  },
});

const UL = styled("ul", {
  base: {
    listStyle: "initial",
    paddingLeft: 4,
    color: "gray.400",
  },
});

const Strong = styled("span", {
  base: {
    color: "brand.500",
    fontWeight: "bold",
  },
});

const SummaryGrid = styled("div", {
  base: {
    display: "grid",
    gap: 6,
    mt: 8,
    gridTemplateColumns: { base: "1fr", md: "1fr 1fr" },
  },
});

const SummaryBox = styled("div", {
  base: {
    p: 6,
    bgColor: "gray.900",
    rounded: "xl",
    borderWidth: 1,
    borderColor: "gray.800",
    textAlign: "left",
  },
});

const Card = styled("div", {
  base: {
    borderWidth: 1,
    borderColor: "gray.800",
    rounded: "xl",
    overflow: "hidden",
    bgColor: "gray.900",
  },
});

const CardHeader = styled("button", {
  base: {
    w: "full",
    p: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    _hover: {
      md: {
        bgColor: "gray.800",
      },
    },
  },
});

const CardContent = styled("div", {
  base: {
    p: 6,
    borderTopWidth: 1,
    borderColor: "gray.800",
  },
});

interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleCard = ({
  title,
  children,
  defaultOpen = false,
}: CollapsibleCardProps) => {
  const disclosure = useDisclosure(defaultOpen);

  return (
    <Card>
      <CardHeader onClick={disclosure.toggle}>
        <H2 textAlign="left">{title}</H2>
        <Box
          transform={disclosure.isOpen ? "rotate(180deg)" : "none"}
          transition="transform 0.2s"
          color="gray.400"
        >
          <RiArrowDownSLine size={24} />
        </Box>
      </CardHeader>
      {disclosure.isOpen && <CardContent>{children}</CardContent>}
    </Card>
  );
};

const FAQSection = styled("div", {
  base: {
    p: 8,
    rounded: "2xl",
    borderWidth: "1px",
    borderColor: "brand.500",
    bgColor: "gray.900",
    position: "relative",
  },
});

const FAQHeader = styled("div", {
  base: {
    textAlign: "center",
    mb: 8,
  },
});

const FAQItem = styled("div", {
  base: {
    borderBottomWidth: "1px",
    borderColor: "gray.800",
    "&:last-child": {
      borderBottomWidth: 0,
    },
  },
});

const FAQButton = styled("button", {
  base: {
    w: "full",
    py: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    color: "white",
    _hover: {
      md: {
        color: "brand.500",
      },
    },
  },
});

interface FAQItemProps {
  question: string;
  answer: string;
}

const CollapsibleFAQ = ({ question, answer }: FAQItemProps) => {
  const disclosure = useDisclosure(false);

  return (
    <FAQItem>
      <FAQButton onClick={disclosure.toggle}>
        <P fontWeight="bold" textAlign="left">
          {question}
        </P>
        <Box
          transform={disclosure.isOpen ? "rotate(180deg)" : "none"}
          transition="transform 0.2s"
          color="inherit"
        >
          <RiArrowDownSLine size={24} />
        </Box>
      </FAQButton>
      {disclosure.isOpen && (
        <Box py={4}>
          <P>{answer}</P>
        </Box>
      )}
    </FAQItem>
  );
};

const Page = () => {
  return (
    <styled.div
      css={{
        background: `
          linear-gradient(180deg,
            rgba(236, 26, 85, 0.05) 0%,
            rgba(236, 26, 85, 0.02) 20%,
            rgba(0, 0, 0, 1) 100%
          )
        `,
      }}
    >
      <Box
        pos="relative"
        zIndex={1}
        _after={{
          content: '""',
          display: "block",
          pos: "absolute",
          inset: 0,
          bgGradient: "to-b",
          gradientFrom: "transparent",
          gradientVia: { base: "transparent", md: "transparent 40%" },
          gradientTo: "black",
          zIndex: -1,
        }}
      >
        <Container maxW={800} px={2} pt={8} pb={20}>
          <Box mb={12}>
            <Box textAlign="center">
              <ImageContainer>
                <styled.img
                  src="/2025-cover.jpg"
                  alt="RCDrift UK 2025 Main Event"
                  width="100%"
                />
              </ImageContainer>
              <H1>RCDrift UK 2025</H1>
              <P fontSize="lg" maxW={600} mx="auto" mt={4}>
                We are thrilled to introduce "RCDrift.uk 2025," an innovative
                platform that invites every driver and track to join the
                excitement of a brand-new competitive format.
              </P>

              <Box maxW={400} mx="auto" mt={6}>
                <LinkButton
                  to={`/events/760859d8-2693-4cca-a38c-3af6be4885d7`}
                  w="full"
                >
                  Buy Ticket <RiTicketFill />
                </LinkButton>
              </Box>
            </Box>

            <SummaryGrid>
              <SummaryBox>
                <styled.h3 fontSize="lg" fontWeight="bold" mb={2}>
                  Main Event Details
                </styled.h3>
                <UL>
                  <styled.li>Two-day competition</styled.li>
                  <styled.li>Cash prize pool</styled.li>
                  <styled.li>Two large tracks</styled.li>
                  <styled.li>Double elimination battles</styled.li>
                  <styled.li>Live stream production</styled.li>
                  <styled.li>International participation</styled.li>
                </UL>
              </SummaryBox>
              <SummaryBox>
                <styled.h3 fontSize="lg" fontWeight="bold" mb={2}>
                  Feeder Rounds
                </styled.h3>
                <UL>
                  <styled.li>10+ certified competitions</styled.li>
                  <styled.li>Hosted across the UK</styled.li>
                  <styled.li>Real-time results system</styled.li>
                  <styled.li>RCDrift.uk prizes</styled.li>
                  <styled.li>Driver Rating contribution</styled.li>
                  <styled.li>Official judging criteria</styled.li>
                </UL>
              </SummaryBox>
            </SummaryGrid>
          </Box>

          <Box mb={12}>
            <H2 textAlign="center">Competition Structure</H2>
            <P textAlign="center" mb={6} maxW={500} mx="auto">
              Designed to provide an exciting and competitive experience for all
              participants. The structure includes multiple stages, starting
              with Feeder Rounds and culminating into one Main Event.
            </P>
            <ImageContainer>
              <styled.img
                src="/2025/tournament-structure.jpg"
                alt="RCDrift UK 2025 Competition Structure"
                width="100%"
              />
            </ImageContainer>
          </Box>

          <Flex flexDir="column" gap={8}>
            <CollapsibleCard title="The Main Event" defaultOpen={true}>
              <P>
                The main event will see a two day competition hosted in a
                central location.
              </P>

              <P color="brand.500" display="flex" alignItems="center" gap={2}>
                <RiCalendar2Fill />
                Saturday, November 8th - Sunday, November 9th, 2025
              </P>

              <styled.a
                color="brand.500"
                display="flex"
                alignItems="center"
                gap={2}
                href="https://maps.google.com/?q=Tudor+Grange+Academy+Redditch+B98+7UH"
                target="_blank"
                _hover={{
                  md: {
                    textDecoration: "underline",
                  },
                }}
              >
                <RiMapPin2Fill /> Tudor Grange Academy, Redditch, B98 7UH
              </styled.a>

              <P mt={6}>Housing two large tracks:</P>
              <UL>
                <styled.li>One competition track</styled.li>
                <styled.li>One practice/casual track</styled.li>
              </UL>

              <H3>Day 1 Agenda</H3>
              <UL>
                <styled.li>Practice Driving</styled.li>
                <styled.li>International Qualifying</styled.li>
                <styled.li>Online real-time results</styled.li>
                <styled.li>Best shell competition</styled.li>
                <styled.li>Best chassis competition</styled.li>
              </UL>

              <H3>Day 2 Agenda</H3>
              <UL>
                <styled.li>Double Elimination Battles</styled.li>
                <styled.li>Full Live Stream Production</styled.li>
                <styled.li>Awards Ceremony</styled.li>
              </UL>

              <P mt={6}>
                International qualifying will include any unranked non-U.K
                residential drivers completing two judged qualifying laps, with
                a maximum of 100 points on offer for each run.
              </P>

              <P>
                A qualifying standing will then be produced using the RCDrift.uk
                driver ratings combined with the international qualifying
                results, and used to seed the competition's double-elimination
                battle tree.
              </P>
              <P>
                RCDrift.uk will be running a high-end live stream production
                across all social channels and on the RCDrift.uk website using
                their real-time results software and talented production crew,
                ensuring every moment of the action is captured in every detail
                and shared with the world.
              </P>
              <P>
                The competition winners will receive a large cash sum, prizes
                from sponsors, and the title of the RCDrift.uk 2025 Champion.
              </P>

              <P>
                <Strong>
                  UK Drivers must meet the following criteria to qualify for the
                  main event:
                </Strong>
              </P>
              <UL>
                <styled.li>
                  The driver must have competed in at least one feeder round
                  prior to the event
                </styled.li>
                <styled.li>
                  The driver must be ranked within the driver ratings
                </styled.li>
                <styled.li>
                  The driver must be within the top 64 drivers within the driver
                  ratings
                </styled.li>
              </UL>

              <Box mt={4}>
                <LinkButton
                  to="https://www.google.com/maps/search/Hotels/@52.2999802,-1.9325026,7236m/data=!3m1!1e3!4m13!2m12!3m6!1sHotels!2sTudor+Grange+Academy,+Redditch,+Woodrow+Dr,+Redditch+B98+7UH!3s0x4870c10cb0889b39:0x6122ace3f5be76b0!4m2!1d-1.9094744!2d52.2822365!5m3!5m2!4m1!1i1!6e3?entry=ttu&g_ep=EgoyMDI0MTEyNC4xIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  variant="secondary"
                >
                  <RiMapPin2Fill /> View Nearby Hotels
                </LinkButton>
              </Box>

              <ImageContainer>
                <styled.img
                  src="/2025/prize-pool.jpg"
                  alt="RCDrift UK 2025 Prize Pool"
                  width="full"
                />
              </ImageContainer>

              <ImageContainer>
                <styled.img
                  src="/2025/rcdriftuk-map.jpg"
                  alt="RCDrift UK 2025 Main Event Map"
                  width="full"
                />
              </ImageContainer>
            </CollapsibleCard>

            <CollapsibleCard title="Double Elimination Format">
              <P>Double elimination works by having two battle trees:</P>
              <ImageContainer>
                <styled.img
                  src="/2025/double-elimination-diagram.jpg"
                  alt="Double Elimination Format Explanation"
                  width="100%"
                />
              </ImageContainer>
              <UL>
                <styled.li>The first tree is an upper bracket</styled.li>
                <styled.li>The second is a lower bracket</styled.li>
                <styled.li>
                  Every driver starts in the upper bracket qualified by their
                  Driver Rating Position
                </styled.li>
                <styled.li>
                  Each driver that loses a battle then drops down into the lower
                  bracket
                </styled.li>
                <styled.li>
                  In the final battle, the two finalists from both brackets
                  battle head to head
                </styled.li>
                <styled.li>
                  If the upper bracket finalist loses the grand final, the
                  battle will be reset and run again
                </styled.li>
              </UL>

              <Link
                to="https://en.wikipedia.org/wiki/Double-elimination_tournament"
                target="_blank"
              >
                <styled.p color="brand.500" mt={4}>
                  Find out more - Double elimination
                </styled.p>
              </Link>

              <P>
                This format ensures that every driver has two opportunities to
                battle before being eliminated from the competition.
              </P>
            </CollapsibleCard>

            <CollapsibleCard title="Driver Ratings">
              <P>
                Driver ratings are the calculation of drivers battle progression
                at U.K run competitions. They can be understood as an average of
                a driver's overall performance.
              </P>

              <P>
                Every driver starts with 1000 points. When battling other
                drivers, points are exchanged based on the existing rating of
                each driver.
              </P>

              <Box
                p={4}
                borderWidth={1}
                borderColor="gray.800"
                rounded="xl"
                bgColor="gray.900"
                my={4}
              >
                <P fontWeight="bold">Example:</P>
                <P>Driver A has 1200 points</P>
                <P>Driver B has 800 points</P>
                <Box my={4}>
                  <P>If Driver A wins against Driver B:</P>
                  <P>5 points will be exchanged</P>
                  <P>Driver A: 1205</P>
                  <P>Driver B: 795</P>
                </Box>
                <Box>
                  <P>If Driver A loses against Driver B:</P>
                  <P>58 points will be exchanged</P>
                  <P>Driver A: 1142</P>
                  <P>Driver B: 858</P>
                </Box>
              </Box>

              <P>The benefits of this rating system include:</P>
              <UL>
                <styled.li>
                  Ensures progression is always attainable for new drivers
                </styled.li>
                <styled.li>Rewards consistency across competitions</styled.li>
                <styled.li>
                  Reduces the impact of inconsistent judging
                </styled.li>
                <styled.li>Provides fair scoring across many events</styled.li>
              </UL>
            </CollapsibleCard>

            <CollapsibleCard title="Feeder Rounds">
              <ImageContainer>
                <styled.img
                  src="/2025/feeder-round-logo.jpg"
                  alt="RCDrift UK 2025 Feeder Rounds"
                  width="100%"
                />
              </ImageContainer>
              <P>
                Feeder rounds are RCDrift.uk certified competitions hosted at
                any U.K track or club. They are organised in partnership with
                RCDrift.uk, ensuring tracks have control while receiving support
                with:
              </P>
              <UL>
                <styled.li>Prizes</styled.li>
                <styled.li>Sourcing judges</styled.li>
                <styled.li>Tournament software</styled.li>
                <styled.li>Judging criteria</styled.li>
                <styled.li>Promotional materials</styled.li>
              </UL>

              <LinkButton to="/2025/schedule" mt={4}>
                View 2025 Schedule
              </LinkButton>
            </CollapsibleCard>

            <CollapsibleCard title="International Participation">
              <P>
                RCDrift.uk is proud to welcome drivers from all over the world
                to compete in our events.
              </P>
              <P>
                To qualify for the main event, unranked non-UK residential
                drivers must complete two judged qualifying laps on Day 1 of the
                main event.
              </P>
              <P>
                A qualifying standing will then be produced using the RCDrift.uk
                driver ratings combined with the international qualifying
                results, and used to seed the competition's double-elimination
                battle tree.
              </P>
            </CollapsibleCard>

            <CollapsibleCard title="General Information">
              <P mb={2}>
                All rules &amp; regulations governing RCDrift.uk-sanctioned
                tournaments and events are available for review at the following
                link:
              </P>

              <LinkButton to="/2025/rules">
                View Rules &amp; Regulations <RiArrowRightLine />
              </LinkButton>

              <ImageContainer>
                <styled.img src="/2025/rcdriftuk-2025-rules.jpg" w="full" />
              </ImageContainer>

              <Divider borderColor="gray.700" />

              <P mb={2}>
                Comprehensive judging criteria to be adhered to at every Feeder
                Round and at The Main Event. This uniform criteria will ensure
                consistency and help prevent discrepancies with judging.
              </P>

              <LinkButton to="/2025/judging-criteria">
                View Judging Criteria <RiArrowRightLine />
              </LinkButton>

              <ImageContainer>
                <styled.img src="/2025/rcdriftuk-2025-criteria.jpg" w="full" />
              </ImageContainer>

              <Divider borderColor="gray.700" />

              <P>
                Our new free online tournament software allows any event's
                results to be viewed online in real-time, functioning as a
                results-only live stream.
              </P>

              <ImageContainer>
                <styled.img src="/2025/rcdriftuk-software-promo.jpg" w="full" />
              </ImageContainer>

              <Divider borderColor="gray.700" />

              <P>
                RCDrift.uk now offers online driver profiles showing ratings,
                ranks, and achievement badges. Sign up and claim your profile
                today!
              </P>

              <ImageContainer>
                <styled.img src="/2025/rcdriftuk-ratings-promo.jpg" w="full" />
              </ImageContainer>
            </CollapsibleCard>

            <CollapsibleCard title="Affiliations">
              <P mb={4}>
                RCDrift.uk is proud to be affiliated with the following
                organisations:
              </P>

              <Flex flexWrap="wrap" gap={4}>
                <Link to="https://www.tiktok.com/@rcdrifttok" target="_blank">
                  <styled.img
                    src="/affiliates/rcdriftok.png"
                    alt="RCDriftok"
                    height="40px"
                    width="auto"
                  />
                </Link>

                <Link to="https://www.sl1d3.com" target="_blank">
                  <styled.img
                    src="/affiliates/sl13de.png"
                    alt="sl13de customs"
                    height="40px"
                    width="auto"
                  />
                </Link>

                <Link
                  to="https://www.instagram.com/fps_rc_drift/"
                  target="_blank"
                >
                  <styled.img
                    src="/affiliates/fps.jpg"
                    alt="FPS Drift"
                    height="40px"
                    width="auto"
                  />
                </Link>
              </Flex>
            </CollapsibleCard>

            <Box
              pos="relative"
              mt={20}
              p={1}
              zIndex={1}
              rounded="3xl"
              borderWidth={1}
              borderColor="brand.500"
              id="faq"
            >
              <Glow />

              <FAQSection>
                <FAQHeader>
                  <H2>Frequently Asked Questions</H2>
                  <P color="brand.500">
                    Everything you need to know about RCDrift UK 2025
                  </P>
                </FAQHeader>

                <CollapsibleFAQ
                  question="Do drivers who attend more feeder rounds get more points?"
                  answer="No, they have more opportunities to gain points, but to do so they have to battle drivers who have a higher rating."
                />

                <CollapsibleFAQ
                  question="Is my rank my qualifying position at the main event?"
                  answer="For UK ranked drivers, yes. For international drivers, no, they are qualified on Day 1 of the main event."
                />

                <CollapsibleFAQ
                  question="Do international drivers have an advantage over UK drivers?"
                  answer="No, when merging the international qualifying results with the RCDrift.uk driver ratings, the top UK ranked driver will be compared to 120 international qualifying points. Ensuring a fair distribution of effort."
                />

                <CollapsibleFAQ
                  question="How does the double elimination format work?"
                  answer="The format consists of two battle trees - an upper and lower bracket. All drivers start in the upper bracket, and if they lose a battle, they drop to the lower bracket. A driver is only eliminated after losing twice. The grand final features winners from both brackets, with a potential reset battle if the upper bracket finalist loses."
                />

                <CollapsibleFAQ
                  question="What happens during the two-day event?"
                  answer="Day 1 is dedicated to practice driving and international qualifying. Day 2 features the double elimination battles competition. The venue provides two tracks: one for competition, one for practice and casual driving."
                />

                <CollapsibleFAQ
                  question="How do driver ratings work?"
                  answer="Every driver starts with 1000 points. Points are exchanged based on battle outcomes, with the exchange amount varying depending on the rating difference between drivers. This system ensures fair progression and rewards consistency across competitions."
                />

                <CollapsibleFAQ
                  question="What are Feeder Rounds?"
                  answer="Feeder Rounds are RCDrift.uk certified competitions hosted across the UK, featuring official judging criteria, real-time results, and contribution to driver rating points. Tracks receive support with prizes, judges, tournament software, and promotional materials."
                />

                <CollapsibleFAQ
                  question="How does international qualifying work?"
                  answer="Non-UK residential drivers complete two judged qualifying laps, with a maximum of 100 points available per run. These results are combined with RCDrift.uk driver ratings to create the competition's qualifying standings, which determine seeding in the battle tree."
                />

                <CollapsibleFAQ
                  question="What support is provided at Feeder Rounds?"
                  answer="RCDrift.uk provides comprehensive support including: prizes, assistance with sourcing qualified judges, tournament management software, standardized judging criteria, and promotional materials. Each track maintains control while benefiting from official certified."
                />

                <CollapsibleFAQ
                  question="How can I follow the competition results?"
                  answer="RCDrift.uk provides a high-end live stream production across all social channels and the website. Additionally, our free online tournament software allows real-time viewing of event results, functioning as a results-only live stream."
                />

                <CollapsibleFAQ
                  question="How can I participate in RCDrift.uk 2025?"
                  answer="You can participate by attending any of the Feeder Rounds happening across the UK. Sign up for a driver profile on RCDrift.uk to track your ratings, ranks, and achievement badges throughout the championship."
                />
              </FAQSection>
            </Box>
          </Flex>
        </Container>
      </Box>
    </styled.div>
  );
};

export default Page;
