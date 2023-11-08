import { Breadcrumbs } from "~/components/Breadcrumbs";
import { LinkButton } from "~/components/Button";
import { Box, Flex, styled } from "~/styled-system/jsx";

interface Props {
  round: string;
  track: string;
  image: string;
  date: string;
  to: string;
}

const Card = ({ round, track, image, date, to }: Props) => {
  return (
    <Flex pt={4} pl={4} w={{ base: "50%", lg: "25%" }}>
      <styled.article bgColor="gray.900" overflow="hidden" rounded="xl">
        <styled.img src={image} />
        <Box p={4}>
          <styled.h1 fontSize="2xl" fontFamily="heading" lineHeight={1}>
            {round} <styled.span color="brand-500">//</styled.span> {track}
          </styled.h1>

          <styled.p color="gray.400">{date}, 2024</styled.p>

          <LinkButton to={to} w="full" mt={4} py={1}>
            More Info
          </LinkButton>
        </Box>
      </styled.article>
    </Flex>
  );
};

const Page = () => {
  return (
    <styled.main>
      <Breadcrumbs
        paths={[
          {
            to: "/2024/schedule",
            title: "Schedule",
          },
        ]}
      />

      <styled.h1
        fontSize="5xl"
        fontFamily="heading"
        lineHeight={1}
        fontStyle="italic"
      >
        2024 Schedule
      </styled.h1>

      <Box maxW={200} h="4px" bgColor="brand-500" mt={2} mb={4} />

      <Box overflow="hidden" rounded="xl" mb={4}>
        <styled.img src="/2024-cover.jpg" w="full" />
      </Box>

      <Box overflow="hidden">
        <Flex flexWrap="wrap" ml={-4} mt={-4}>
          <Card
            round="Launch"
            track="AutoSport International"
            image="/launch-event-cover.jpg"
            date="January 11th - 14th"
            to="/2024/schedule/jan"
          />
          <Card
            round="Round 1"
            track="ScaleDrift"
            image="/round-1-cover.jpg"
            date="March 2nd"
            to="/2024/schedule/mar"
          />
          <Card
            round="Round 2"
            track="Drift Essex"
            image="/round-2-cover.jpg"
            date="April 6th"
            to="/2024/schedule/apr"
          />
          <Card
            round="Round 3"
            track="NRD"
            image="/round-3-cover.jpg"
            date="May 4th"
            to="/2024/schedule/may"
          />
          <Card
            round="Round 4"
            track="Slide House"
            image="/round-4-cover.jpg"
            date="June 1st"
            to="/2024/schedule/jun"
          />
          <Card
            round="Round 5"
            track="MDS"
            image="/round-5-cover.jpg"
            date="July 6th"
            to="/2024/schedule/jul"
          />
          <Card
            round="Round 6"
            track="Ronin Drift Lounge"
            image="/round-6-cover.jpg"
            date="August 3rd"
            to="/2024/schedule/aug"
          />
        </Flex>
      </Box>
    </styled.main>
  );
};

export default Page;
