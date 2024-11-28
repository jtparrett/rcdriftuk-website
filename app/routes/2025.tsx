import { styled, Container, Box, Flex, Grid } from "~/styled-system/jsx";
import { LinkButton } from "~/components/Button";
import { RiMapPin2Fill, RiArrowDownSLine } from "react-icons/ri";
import { useDisclosure } from "~/utils/useDisclosure";
import type { MetaFunction } from "@remix-run/node";
import { ImageContainer } from "~/components/ImageContainer";

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
    fontSize: "2xl",
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
      bgColor: "gray.800",
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
        <H2 my={0}>{title}</H2>
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
    mt: 20,
    mb: 12,
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
      color: "brand.500",
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
    <styled.main
      bgColor="black"
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
          <Box textAlign="center" mb={12}>
            <ImageContainer>
              <styled.img
                src="/2025-cover.jpg"
                alt="RCDrift UK 2025 Main Event"
                width="100%"
              />
            </ImageContainer>
            <H1>RCDrift UK 2025</H1>
            <P fontSize="lg" maxW={600} mx="auto" mt={4}>
              After an amazing 2024 championship, we are proud to present
              "RCDrift.uk 2025". For 2025, RCDrift.uk will be offering a new
              innovative format, allowing every driver and track to take part in
              something amazing.
            </P>

            <SummaryGrid>
              <SummaryBox>
                <styled.h3 fontSize="lg" fontWeight="bold" mb={2}>
                  Main Event Details
                </styled.h3>
                <UL>
                  <styled.li>Two-day tournament format</styled.li>
                  <styled.li>Three dedicated tracks</styled.li>
                  <styled.li>International qualifying day</styled.li>
                  <styled.li>Double elimination battles</styled.li>
                  <styled.li>Live stream production</styled.li>
                  <styled.li>Cash prize pool</styled.li>
                </UL>
              </SummaryBox>
              <SummaryBox>
                <styled.h3 fontSize="lg" fontWeight="bold" mb={2}>
                  Feeder Rounds
                </styled.h3>
                <UL>
                  <styled.li>10+ sanctioned tournaments</styled.li>
                  <styled.li>Hosted across the UK</styled.li>
                  <styled.li>April - June 2025</styled.li>
                  <styled.li>Official judging criteria</styled.li>
                  <styled.li>Real-time results system</styled.li>
                  <styled.li>Driver rating points</styled.li>
                </UL>
              </SummaryBox>
            </SummaryGrid>
          </Box>

          <Box mb={12}>
            <H2 textAlign="center">Tournament Structure</H2>
            <P textAlign="center" mb={6} maxW={500} mx="auto">
              Designed to provide an exciting and competitive experience for all
              participants. The structure includes multiple stages, starting
              with feeder rounds and culminating into the main event.
            </P>
            <ImageContainer>
              <styled.img
                src="/2025/tournament-structure.jpg"
                alt="RCDrift UK 2025 Tournament Structure"
                width="100%"
              />
            </ImageContainer>
          </Box>

          <Flex flexDir="column" gap={8}>
            <CollapsibleCard title="The Main Event" defaultOpen={true}>
              <P>
                The main event will see a two day tournament hosted in the
                centre of the U.K. on [DATE] at [VENUE].
              </P>

              <P>With 3 large tracks at a dedicated venue:</P>
              <UL>
                <styled.li>One competition track</styled.li>
                <styled.li>One practice track</styled.li>
                <styled.li>One casual driving track</styled.li>
              </UL>

              <P>
                Day 1 will consist of Practice Driving and International
                Qualifying. Day 2 will consist of a Double Elimination
                Battles-Only Tournament.
              </P>

              <P>
                International qualifying will include any non-U.K residential
                drivers completing two judged qualifying laps, with a maximum of
                100 points on offer for each run.
              </P>

              <P>
                A qualifying standing will then be produced using the RCDrift.uk
                driver ratings combined with the international qualifying
                results, and used to seed the tournament's double-elimination
                battle tree.
              </P>

              <P>
                RCDrift.uk will be running a high-end live stream production
                across all social channels and on the RCDrift.uk website using
                their real-time tournament results software and high-end
                production crew, ensuring every moment of the action is captured
                in every detail and shared with the world.
              </P>

              <P>
                The tournament winners will receive a large cash sum, prizes
                from our sponsors, and the title of the RCDrift.uk 2025 Winner.
              </P>

              <Box mt={4}>
                <LinkButton to="/map/all" variant="secondary">
                  <RiMapPin2Fill /> View Nearby Hotels
                </LinkButton>
              </Box>
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
                  Every driver starts in the upper bracket (positioned by
                  qualifying standings)
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
              <P>
                This format ensures that every driver has two opportunities to
                battle before being eliminated from the tournament.
              </P>
            </CollapsibleCard>

            <CollapsibleCard title="Driver Ratings">
              <P>
                Driver ratings are the calculation of drivers battle progression
                at U.K run tournaments. They can be understood as an average of
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
                Feeder rounds are RCDrift.uk sanctioned tournaments hosted at
                any U.K track or club. They are organised in partnership with
                RCDrift.uk, ensuring tracks have full control while receiving
                support with:
              </P>
              <UL>
                <styled.li>Prizes</styled.li>
                <styled.li>Sourcing judges</styled.li>
                <styled.li>Tournament software</styled.li>
                <styled.li>Judging criteria</styled.li>
                <styled.li>Promotional materials</styled.li>
              </UL>

              <Box
                p={4}
                borderWidth={1}
                borderColor="gray.800"
                rounded="xl"
                bgColor="gray.900"
                my={4}
              >
                <P fontWeight="bold">Confirmed 2025 Feeder Rounds:</P>
                <Grid
                  gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }}
                  gap={4}
                >
                  <Box>
                    <P>BBRC: April 6th</P>
                    <P>Drift Spot Lincoln: April 13th</P>
                    <P>Pro-Tech Drift Lounge: May 10th</P>
                    <P>E-Drift Salisbury: May 17th</P>
                    <P>Kustom Kulture: June 7th</P>
                  </Box>
                  <Box>
                    <P>Drift Essex: Date TBC</P>
                    <P>ScaleDrift: Date TBC</P>
                    <P>EYD: Date TBC</P>
                    <P>Drift Knights: Date TBC</P>
                    <P>SlideNation: Date TBC</P>
                  </Box>
                </Grid>
              </Box>
            </CollapsibleCard>

            <CollapsibleCard title="General Information">
              <P>
                RCDrift.uk will release a comprehensive judging criteria to be
                adhered to at every Feeder Round and at The Main Event. This
                uniform criteria will ensure consistency and help prevent
                discrepancies with judging.
              </P>

              <P>
                Our new free online tournament software allows any event's
                results to be viewed online in real-time, functioning as a
                results-only live stream.
              </P>

              <P>
                RCDrift.uk now offers online driver profiles showing ratings,
                ranks, and achievement badges. Sign up and claim your profile
                today!
              </P>
            </CollapsibleCard>

            <FAQSection>
              <FAQHeader>
                <H2>Frequently Asked Questions</H2>
                <P color="brand.500">
                  Everything you need to know about RCDrift UK 2025
                </P>
              </FAQHeader>

              <CollapsibleFAQ
                question="How does the double elimination format work?"
                answer="The format consists of two battle trees - an upper and lower bracket. All drivers start in the upper bracket, and if they lose a battle, they drop to the lower bracket. A driver is only eliminated after losing twice. The grand final features winners from both brackets, with a potential reset battle if the upper bracket finalist loses."
              />

              <CollapsibleFAQ
                question="What happens during the two-day event?"
                answer="Day 1 is dedicated to practice driving and international qualifying. Day 2 features the double elimination battles tournament. The venue provides three tracks: one for competition, one for practice, and one for casual driving."
              />

              <CollapsibleFAQ
                question="How do driver ratings work?"
                answer="Every driver starts with 1000 points. Points are exchanged based on battle outcomes, with the exchange amount varying depending on the rating difference between drivers. This system ensures fair progression and rewards consistency across competitions."
              />

              <CollapsibleFAQ
                question="What are Feeder Rounds?"
                answer="Feeder Rounds are RCDrift.uk sanctioned tournaments hosted at various UK tracks and clubs. They run from April to June 2025, featuring official judging criteria, real-time results, and contribute to driver rating points. Tracks receive support with prizes, judges, tournament software, and promotional materials."
              />

              <CollapsibleFAQ
                question="How does international qualifying work?"
                answer="Non-UK residential drivers complete two judged qualifying laps, with a maximum of 100 points available per run. These results are combined with RCDrift.uk driver ratings to create the tournament's qualifying standings, which determine seeding in the battle tree."
              />

              <CollapsibleFAQ
                question="What support is provided at Feeder Rounds?"
                answer="RCDrift.uk provides comprehensive support including: prizes, assistance with sourcing qualified judges, tournament management software, standardized judging criteria, and promotional materials. Each track maintains control while benefiting from official sanctioning."
              />

              <CollapsibleFAQ
                question="How can I follow the tournament results?"
                answer="RCDrift.uk provides a high-end live stream production across all social channels and the website. Additionally, our free online tournament software allows real-time viewing of event results, functioning as a results-only live stream."
              />

              <CollapsibleFAQ
                question="How can I participate in RCDrift.uk 2025?"
                answer="You can participate by attending any of the Feeder Rounds happening between April and June 2025. Sign up for a driver profile on RCDrift.uk to track your ratings, ranks, and achievement badges throughout the championship."
              />
            </FAQSection>
          </Flex>
        </Container>
      </Box>
    </styled.main>
  );
};

export default Page;
