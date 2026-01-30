import {
  RiCalendarEventFill,
  RiMapPin2Fill,
  RiTrophyFill,
  RiTeamFill,
  RiMailFill,
  RiStarFill,
  RiAlertFill,
  RiToolsFill,
} from "react-icons/ri";
import { Box, Container, Flex, Grid, styled } from "~/styled-system/jsx";
import { DashedLine } from "~/components/DashedLine";
import { LinkButton } from "~/components/Button";

export const meta = () => {
  return [
    { title: `SDC 2026 Worlds | Los Angeles` },
    {
      name: "description",
      content:
        "Super-G RC Drift Arena hosts SDC 2026 Worlds / Finals in Los Angeles, CA. October 2-4, 2026. The ultimate RC drift competition.",
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

const Page = () => {
  return (
    <styled.div>
      {/* Hero Section */}
      <Box
        bgImage="linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.9)), url(https://ngo12if6yyhjvs7m.public.blob.vercel-storage.com/super-g-hero.jpg)"
        bgSize="cover"
        bgPosition="center"
        pos="relative"
      >
        <Container maxW={1100} px={4} pt={{ base: 12, md: 20 }} pb={16}>
          <styled.h1 srOnly>SDC 2026 Worlds</styled.h1>
          <Box maxW={500} mx="auto" mb={8}>
            <styled.img
              w="full"
              src="https://ngo12if6yyhjvs7m.public.blob.vercel-storage.com/sdc-logo-sm.png"
              alt="SDC 2026"
            />
          </Box>

          <Flex
            alignItems="center"
            justifyContent="center"
            gap={2}
            mb={6}
            fontSize={{ base: "2xl", md: "3xl" }}
          >
            <RiStarFill />
            <RiStarFill />
            <styled.span
              fontWeight="black"
              textTransform="uppercase"
              letterSpacing="4px"
              fontSize={{ base: "lg", md: "xl" }}
              color="white"
            >
              World Finals
            </styled.span>
            <RiStarFill />
            <RiStarFill />
          </Flex>

          <Box textAlign="center" maxW={700} mx="auto">
            <styled.p
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="medium"
              mb={4}
            >
              Super-G RC Drift Arena
            </styled.p>
            <Flex
              alignItems="center"
              justifyContent="center"
              gap={2}
              color="gray.400"
              mb={2}
            >
              <RiMapPin2Fill />
              <styled.span>Los Angeles, California</styled.span>
            </Flex>
            <Flex
              alignItems="center"
              justifyContent="center"
              gap={2}
              color="brand.500"
              fontWeight="bold"
              fontSize="lg"
            >
              <RiCalendarEventFill />
              <styled.span>October 2, 3, 4, 2026</styled.span>
            </Flex>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW={1100} px={4} py={12}>
        {/* Event Schedule */}
        <Box mb={16}>
          <Flex alignItems="center" gap={3} mb={8}>
            <RiCalendarEventFill
              fontSize="24px"
              color="var(--colors-brand-500)"
            />
            <styled.h2
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="2px"
            >
              Event Schedule
            </styled.h2>
          </Flex>

          <Grid
            columns={{ base: 1, md: 2 }}
            gap={6}
            bgColor="gray.900"
            rounded="2xl"
            borderWidth={1}
            borderColor="gray.800"
            p={6}
          >
            <Flex direction="column" gap={6}>
              <ScheduleItem
                date="Sep 29"
                title="Track Opens for Practice"
                description="Track layout open for tuning and practice sessions"
              />
              <ScheduleItem
                date="Oct 1"
                title="Meet and Greet"
                description="Welcome event - meet fellow competitors and organizers"
              />
            </Flex>
            <Flex direction="column" gap={6}>
              <ScheduleItem
                date="Oct 2-4"
                title="SDC 2026 Worlds"
                description="Main competition days - World Finals"
              />
            </Flex>
          </Grid>

          <Box
            mt={4}
            bgColor="yellow.950"
            borderWidth={1}
            borderColor="yellow.800"
            rounded="xl"
            p={4}
          >
            <Flex alignItems="center" gap={3}>
              <RiAlertFill color="var(--colors-yellow-500)" fontSize="20px" />
              <styled.p color="yellow.200" fontSize="sm">
                <styled.span fontWeight="bold">Note:</styled.span> Super-G will
                be closed September 18 - 28 for event preparation.
              </styled.p>
            </Flex>
          </Box>
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

        <DashedLine />

        {/* Venue Info */}
        <Box my={16}>
          <Flex alignItems="center" gap={3} mb={6}>
            <RiMapPin2Fill fontSize="24px" color="var(--colors-brand-500)" />
            <styled.h2
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="2px"
            >
              Venue
            </styled.h2>
          </Flex>

          <Grid columns={{ base: 1, md: 2 }} gap={6}>
            <InfoCard icon={<RiMapPin2Fill />} title="Super-G RC Drift Arena">
              <styled.p mb={2}>
                One of the premier RC drift venues in the United States, Super-G
                RC Drift Arena will host the SDC 2026 World Finals.
              </styled.p>
              <styled.p fontWeight="medium" color="white">
                Los Angeles, California
              </styled.p>
            </InfoCard>

            <InfoCard icon={<RiToolsFill />} title="Practice & Tuning">
              <styled.p>
                The track layout will be open for tuning and practice sessions
                starting{" "}
                <styled.span fontWeight="bold" color="white">
                  Tuesday, September 29
                </styled.span>
                .
              </styled.p>
              <styled.p mt={2} color="gray.400" fontSize="sm">
                Get your setup dialed in before competition begins.
              </styled.p>
            </InfoCard>
          </Grid>
        </Box>
      </Container>
    </styled.div>
  );
};

export default Page;
