import {
  RiCalendarEventFill,
  RiMapPin2Fill,
  RiTrophyFill,
  RiTeamFill,
  RiMailFill,
  RiStarFill,
  RiAlertFill,
  RiGlobalLine,
  RiMedalFill,
  RiGroupFill,
  RiCheckboxCircleFill,
  RiEditFill,
  RiHome4Fill,
  RiQuestionFill,
} from "react-icons/ri";
import { Box, Container, Flex, Grid, styled } from "~/styled-system/jsx";
import { DashedLine } from "~/components/DashedLine";
import { LinkButton } from "~/components/Button";

export const meta = () => {
  return [
    { title: `SDC 2026 | Super Drift Competition` },
    {
      name: "description",
      content:
        "Super Drift Competition 2026 - The premier RC drift championship series. Compete in regional rounds across the United States and qualify for the World Finals in Los Angeles.",
    },
  ];
};

const InfoCard = ({
  icon,
  title,
  children,
  accent = false,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) => (
  <Box
    bgColor={accent ? "brand.950" : "gray.900"}
    borderWidth={1}
    borderColor={accent ? "brand.800" : "gray.800"}
    rounded="2xl"
    p={6}
    h="full"
  >
    <Flex alignItems="center" gap={3} mb={4}>
      <Box
        bgColor={accent ? "brand.600" : "gray.800"}
        rounded="xl"
        p={2}
        fontSize="xl"
      >
        {icon}
      </Box>
      <styled.h3
        fontWeight="bold"
        fontSize="lg"
        textTransform="uppercase"
        letterSpacing="1px"
      >
        {title}
      </styled.h3>
    </Flex>
    <styled.div color="gray.300" lineHeight="relaxed">
      {children}
    </styled.div>
  </Box>
);

const ScheduleItem = ({
  date,
  title,
  description,
}: {
  date: string;
  title: string;
  description: string;
}) => (
  <Flex gap={4} alignItems="flex-start">
    <Box
      bgColor="gray.800"
      rounded="xl"
      p={3}
      minW="80px"
      textAlign="center"
      borderWidth={1}
      borderColor="gray.700"
    >
      <styled.span
        display="block"
        fontSize="xs"
        textTransform="uppercase"
        color="gray.400"
      >
        {date.split(" ")[0]}
      </styled.span>
      <styled.span display="block" fontSize="2xl" fontWeight="bold">
        {date.split(" ")[1]}
      </styled.span>
    </Box>
    <Box>
      <styled.h4 fontWeight="bold" mb={1}>
        {title}
      </styled.h4>
      <styled.p color="gray.400" fontSize="sm">
        {description}
      </styled.p>
    </Box>
  </Flex>
);

const QualificationItem = ({ children }: { children: React.ReactNode }) => (
  <Flex gap={3} alignItems="flex-start">
    <Box color="brand.500" mt={0.5}>
      <RiCheckboxCircleFill />
    </Box>
    <styled.span>{children}</styled.span>
  </Flex>
);

const Page = () => {
  return (
    <styled.div>
      {/* Hero Section */}
      <Box
        bgImage="linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.9)), url(https://ngo12if6yyhjvs7m.public.blob.vercel-storage.com/Group_Photo_8c37c991-c88d-43ba-9614-b8b874315868_1024x1024.webp)"
        bgSize="cover"
        bgPosition="center"
        pos="relative"
      >
        <Container maxW={1100} px={4} pt={{ base: 12, md: 20 }} pb={16}>
          <styled.h1 srOnly>SDC 2026 - Super Drift Competition</styled.h1>
          <Box maxW={500} mx="auto" mb={6}>
            <styled.img
              w="full"
              src="https://ngo12if6yyhjvs7m.public.blob.vercel-storage.com/sdc-logo-sm.png"
              alt="SDC 2026"
            />
          </Box>

          <styled.p
            textAlign="center"
            fontSize={{ base: "lg", md: "xl" }}
            lineHeight="tight"
            fontWeight="medium"
            color="gray.300"
            maxW={{ base: 320, md: 400 }}
            mx="auto"
            mb={6}
            textWrap="balance"
          >
            The premier RC drift competition series in the United States
          </styled.p>

          <Flex justifyContent="center" gap={4} flexWrap="wrap" mb={8}>
            <Flex
              alignItems="center"
              gap={2}
              bgColor="gray.900"
              borderWidth={1}
              borderColor="gray.800"
              rounded="full"
              px={4}
              py={2}
            >
              <RiGlobalLine color="var(--colors-brand-500)" />
              <styled.span fontSize="sm">28 Regional Tracks</styled.span>
            </Flex>
            <Flex
              alignItems="center"
              gap={2}
              bgColor="gray.900"
              borderWidth={1}
              borderColor="gray.800"
              rounded="full"
              px={4}
              py={2}
            >
              <RiTrophyFill color="var(--colors-brand-500)" />
              <styled.span fontSize="sm">World Finals in LA</styled.span>
            </Flex>
            <Flex
              alignItems="center"
              gap={2}
              bgColor="gray.900"
              borderWidth={1}
              borderColor="gray.800"
              rounded="full"
              px={4}
              py={2}
            >
              <RiEditFill color="var(--colors-brand-500)" />
              <styled.span fontSize="sm">Free Registration</styled.span>
            </Flex>
          </Flex>

          <Flex justifyContent="center">
            <LinkButton
              to="https://super-drift.com/registration/"
              variant="primary"
            >
              <RiEditFill />
              Register for SDC 2026
            </LinkButton>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW={1100} px={4} py={12}>
        {/* About SDC */}
        <Box mb={16}>
          <Flex alignItems="center" gap={3} mb={6}>
            <RiTrophyFill fontSize="24px" color="var(--colors-brand-500)" />
            <styled.h2
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="2px"
            >
              About SDC
            </styled.h2>
          </Flex>

          <Grid columns={{ base: 1, md: 2 }} gap={6}>
            <InfoCard icon={<RiGlobalLine />} title="The Competition">
              <styled.p mb={3}>
                The Super Drift Competition (SDC) is the premier competitive RC
                drift series in the United States, bringing together the best
                drivers from across the country to compete for the title of
                champion.
              </styled.p>
              <styled.p>
                SDC is completely free to enter. We just ask you support your
                local track and shop if possible—they're the ones putting in
                work to give you a place to compete!
              </styled.p>
            </InfoCard>

            <InfoCard icon={<RiCalendarEventFill />} title="2026 Season">
              <styled.ul pl={4} listStyleType="disc">
                <styled.li mb={2}>
                  Season runs{" "}
                  <styled.span fontWeight="bold" color="white">
                    February 1 – September 6, 2026
                  </styled.span>
                </styled.li>
                <styled.li mb={2}>
                  Minimum 4 rounds per region (6-8 preferred)
                </styled.li>
                <styled.li mb={2}>
                  Compete at your Home Region to accumulate points
                </styled.li>
                <styled.li>
                  World Finals at Super-G RC Drift Arena, October 2-4, 2026
                </styled.li>
              </styled.ul>
            </InfoCard>
          </Grid>
        </Box>

        <DashedLine />

        {/* SDC Network */}
        <Box my={16}>
          <Flex alignItems="center" gap={3} mb={6}>
            <RiMapPin2Fill fontSize="24px" color="var(--colors-brand-500)" />
            <styled.h2
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="2px"
            >
              2026 Network
            </styled.h2>
          </Flex>

          <styled.p color="gray.400" mb={6}>
            SDC 2026 features 28 regional tracks across the United States. Each
            track hosts their own competition rounds throughout the season.
          </styled.p>

          <Box
            bgColor="black"
            rounded="2xl"
            overflow="hidden"
            borderWidth={1}
            borderColor="gray.800"
            mb={6}
          >
            <styled.img
              w="full"
              src="/sdc-2026-network.png"
              alt="SDC 2026 Network - 28 Regional Tracks"
            />
          </Box>

          <Grid columns={{ base: 1, md: 2 }} gap={6}>
            <InfoCard icon={<RiHome4Fill />} title="Home Region">
              <styled.p mb={3}>
                Your Home Region is where your points accumulate for the SDC
                2026 Series. This is the only region where you'll receive
                competition and participation points.
              </styled.p>
              <styled.p fontSize="sm" color="gray.400">
                Note: Your Home Region doesn't need to be the closest to where
                you live—choose the region you want to primarily compete at.
              </styled.p>
            </InfoCard>

            <InfoCard icon={<RiGroupFill />} title="Compete Anywhere">
              <styled.p mb={3}>
                You can compete in as many SDC 2026 Regional Competitions as you
                wish! You're encouraged to compete outside your Home Region.
              </styled.p>
              <styled.p fontSize="sm" color="gray.400">
                Just be aware: while you can win at any region, points will only
                count in your Home Region.
              </styled.p>
            </InfoCard>
          </Grid>
        </Box>

        <DashedLine />

        {/* How to Qualify */}
        <Box my={16}>
          <Flex alignItems="center" gap={3} mb={6}>
            <RiMedalFill fontSize="24px" color="var(--colors-brand-500)" />
            <styled.h2
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="2px"
            >
              Qualify for Worlds
            </styled.h2>
          </Flex>

          <Box
            bgColor="gray.900"
            borderWidth={1}
            borderColor="gray.800"
            rounded="2xl"
            p={6}
            mb={6}
          >
            <styled.p color="gray.300" mb={4}>
              There are several ways to qualify for SDC 2026 Worlds:
            </styled.p>

            <Flex direction="column" gap={3}>
              <QualificationItem>
                Participate in a minimum of{" "}
                <styled.span fontWeight="bold" color="white">
                  50% of Home Regional Rounds
                </styled.span>
              </QualificationItem>
              <QualificationItem>
                <styled.span fontWeight="bold" color="white">
                  Podium Finish
                </styled.span>{" "}
                in a Home Regional Round
              </QualificationItem>
              <QualificationItem>
                Official Judge for{" "}
                <styled.span fontWeight="bold" color="white">
                  75% of Regional Rounds
                </styled.span>{" "}
                (must be included with regional results)
              </QualificationItem>
              <QualificationItem>Shop / Track Owner</QualificationItem>
              <QualificationItem>International Competitors</QualificationItem>
            </Flex>

            <Box
              mt={6}
              bgColor="yellow.950"
              borderWidth={1}
              borderColor="yellow.800"
              rounded="xl"
              p={4}
            >
              <Flex alignItems="center" gap={2}>
                <RiAlertFill color="var(--colors-yellow-500)" fontSize="18px" />
                <styled.p color="yellow.200" fontSize="sm">
                  <styled.span fontWeight="bold">
                    175 competitor cap
                  </styled.span>{" "}
                  for 2026 Worlds. Drivers competing in SDC Regionals will be
                  given priority.
                </styled.p>
              </Flex>
            </Box>
          </Box>

          <Box
            bgColor="brand.950"
            borderWidth={1}
            borderColor="brand.800"
            rounded="xl"
            p={4}
          >
            <Flex alignItems="center" gap={2} mb={2}>
              <RiQuestionFill color="var(--colors-brand-400)" />
              <styled.span fontWeight="bold" color="brand.300">
                Important: Register Before You Compete!
              </styled.span>
            </Flex>
            <styled.p color="brand.200" fontSize="sm">
              Points will NOT accumulate until AFTER you register. Make sure you
              register BEFORE your first competition starts, otherwise no points
              will be awarded and participation will NOT count toward the
              minimum.
            </styled.p>
          </Box>
        </Box>

        <DashedLine />

        {/* World Finals Section */}
        <Box my={16}>
          <Flex alignItems="center" gap={3} mb={2}>
            <Box
              bgColor="brand.600"
              color="white"
              px={3}
              py={1}
              rounded="full"
              fontSize="xs"
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="1px"
            >
              October 2026
            </Box>
          </Flex>

          <Flex alignItems="center" gap={3} mb={6}>
            <RiStarFill fontSize="24px" color="var(--colors-brand-500)" />
            <styled.h2
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="2px"
            >
              SDC 2026 Worlds
            </styled.h2>
          </Flex>

          <Box
            bgColor="brand.950"
            borderWidth={1}
            borderColor="brand.800"
            rounded="2xl"
            p={6}
            mb={6}
          >
            <Flex
              alignItems="center"
              justifyContent="center"
              gap={2}
              mb={4}
              fontSize={{ base: "xl", md: "2xl" }}
            >
              <RiStarFill />
              <RiStarFill />
              <styled.span
                fontWeight="black"
                textTransform="uppercase"
                letterSpacing="4px"
                fontSize={{ base: "md", md: "lg" }}
                color="white"
              >
                Los Angeles
              </styled.span>
              <RiStarFill />
              <RiStarFill />
            </Flex>

            <Box textAlign="center">
              <styled.p fontSize="xl" fontWeight="medium" mb={2}>
                Super-G RC Drift Arena
              </styled.p>
              <Flex
                alignItems="center"
                justifyContent="center"
                gap={2}
                color="brand.400"
                fontWeight="bold"
                fontSize="lg"
                mb={2}
              >
                <RiCalendarEventFill />
                <styled.span>October 2, 3, 4, 2026</styled.span>
              </Flex>
              <styled.p color="gray.400" fontSize="sm">
                Meet and Greet on October 1
              </styled.p>
            </Box>
          </Box>

          <Grid columns={{ base: 1, md: 2 }} gap={6}>
            <Box
              bgColor="gray.900"
              borderWidth={1}
              borderColor="gray.800"
              rounded="xl"
              p={5}
            >
              <styled.h4 fontWeight="bold" mb={3}>
                Finals Week Schedule
              </styled.h4>
              <Flex direction="column" gap={4}>
                <ScheduleItem
                  date="Sep 29"
                  title="Track Opens for Practice"
                  description="Track layout open for tuning and practice sessions"
                />
                <ScheduleItem
                  date="Oct 1"
                  title="Meet and Greet"
                  description="Welcome event - meet fellow competitors"
                />
                <ScheduleItem
                  date="Oct 2-4"
                  title="SDC 2026 Worlds"
                  description="Main competition and championship rounds"
                />
              </Flex>
            </Box>

            <Flex direction="column" gap={4}>
              <Box
                bgColor="gray.900"
                borderWidth={1}
                borderColor="gray.800"
                rounded="xl"
                p={5}
              >
                <styled.h4 fontWeight="bold" mb={3}>
                  Regional Champion Perks
                </styled.h4>
                <styled.p color="gray.300" fontSize="sm" mb={3}>
                  Super-G will provide lodging for each Regional Champion of
                  Qualifying Regions for the nights of October 2-3, 2026.
                </styled.p>
                <styled.p color="gray.400" fontSize="xs">
                  Deadline for lodging arrangements: September 19, 2026
                </styled.p>
              </Box>

              <Box
                bgColor="yellow.950"
                borderWidth={1}
                borderColor="yellow.800"
                rounded="xl"
                p={4}
              >
                <Flex alignItems="center" gap={2}>
                  <RiAlertFill
                    color="var(--colors-yellow-500)"
                    fontSize="18px"
                  />
                  <styled.p color="yellow.200" fontSize="sm">
                    Super-G will be closed September 18 - 28 for event
                    preparation.
                  </styled.p>
                </Flex>
              </Box>
            </Flex>
          </Grid>
        </Box>

        <DashedLine />

        {/* NEW Championship Round */}
        <Box my={16}>
          <Flex alignItems="center" gap={3} mb={2}>
            <Box
              bgColor="brand.600"
              color="white"
              px={3}
              py={1}
              rounded="full"
              fontSize="xs"
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="1px"
            >
              All New for 2026
            </Box>
          </Flex>

          <Flex alignItems="center" gap={3} mb={6}>
            <RiTrophyFill fontSize="24px" color="var(--colors-brand-500)" />
            <styled.h2
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="2px"
            >
              Regional Champions Championship
            </styled.h2>
          </Flex>

          <InfoCard
            icon={<RiTrophyFill />}
            title="Special Championship Round"
            accent
          >
            <styled.p mb={4}>
              We will be adding a{" "}
              <styled.span fontWeight="bold" color="brand.400">
                Special Championship Round
              </styled.span>{" "}
              for the Regional Champions to compete in.
            </styled.p>
            <styled.p mb={4}>
              Each Regional Champion will be automatically entered to compete in
              this round. This will crown the official{" "}
              <styled.span fontWeight="bold" color="white">
                United States Super Drift Competition Champion
              </styled.span>
              .
            </styled.p>
            <Flex
              alignItems="center"
              gap={2}
              bgColor="brand.900"
              rounded="lg"
              p={3}
              mt={4}
              borderWidth={1}
              borderColor="brand.700"
            >
              <RiStarFill color="var(--colors-brand-400)" />
              <styled.span color="brand.300" fontSize="sm" fontWeight="medium">
                Regional Champions are automatically qualified
              </styled.span>
            </Flex>
          </InfoCard>
        </Box>

        <DashedLine />

        {/* Help Section */}
        <Box my={16}>
          <Flex alignItems="center" gap={3} mb={6}>
            <RiTeamFill fontSize="24px" color="var(--colors-brand-500)" />
            <styled.h2
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="2px"
            >
              Join the Team
            </styled.h2>
          </Flex>

          <Box
            bgColor="gray.900"
            borderWidth={1}
            borderColor="gray.800"
            rounded="2xl"
            p={6}
          >
            <styled.h3 fontWeight="bold" fontSize="xl" mb={4}>
              Do you want to help SDC?
            </styled.h3>
            <styled.p color="gray.300" lineHeight="relaxed" mb={6}>
              If you are interested in helping and being a part of the SDC
              workings, we'd love to hear from you. The past few seasons have
              become increasingly difficult for us to handle on our own. We feel
              with the right help, SDC can be an even more enjoyable series for
              everyone involved.
            </styled.p>

            <LinkButton to="mailto:Steve.superg@gmail.com" variant="primary">
              <RiMailFill />
              Contact Steve.superg@gmail.com
            </LinkButton>
          </Box>
        </Box>
      </Container>
    </styled.div>
  );
};

export default Page;
