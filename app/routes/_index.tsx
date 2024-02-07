import { MetaFunction } from "@remix-run/node";
import {
  RiCalendarFill,
  RiFacebookFill,
  RiInstagramFill,
  RiListOrdered2,
  RiMapPin2Fill,
  RiSearchLine,
} from "react-icons/ri";
import { LinkButton } from "~/components/Button";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";

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
  return (
    <Box
      bgGradient="to-b"
      gradientFrom="brand.700"
      gradientVia="transparent"
      gradientTo="transparent"
    >
      <styled.h1 srOnly>RC Drift UK - Home</styled.h1>
      <Container maxW={450} py={24}>
        <Box>
          <styled.img w={160} src="/rcdriftuk.svg" mx="auto" mb={8} />

          <Box
            bgColor="rgba(0, 0, 0, 0.8)"
            backdropFilter="blur(10px)"
            p={8}
            rounded="xl"
          >
            <Flex flexDir="column" gap={3}>
              <LinkButton to="/map/all" variant="secondary">
                Find Your Local Track <RiMapPin2Fill />
              </LinkButton>
              <LinkButton to="/calendar" variant="secondary">
                UK Drift Calendar <RiCalendarFill />
              </LinkButton>
              <LinkButton to="/catalogue" variant="secondary">
                Shops Catalogue <RiSearchLine />
              </LinkButton>
              <LinkButton to="/ratings" variant="secondary">
                Driver Ratings <RiListOrdered2 />
              </LinkButton>
              <LinkButton to="/2024/schedule" variant="primary">
                🏆 2024 Championship 🏆
              </LinkButton>
            </Flex>
          </Box>
        </Box>

        <Flex justifyContent="center" gap={4} pt={8}>
          <styled.a
            fontSize="2xl"
            target="_blank"
            href="https://www.facebook.com/RCDriftingUK/"
          >
            <RiFacebookFill />
          </styled.a>

          <styled.a
            target="_blank"
            fontSize="2xl"
            href="https://www.instagram.com/rcdriftuk"
          >
            <RiInstagramFill />
          </styled.a>
        </Flex>
      </Container>
    </Box>
  );
};

export default Page;
