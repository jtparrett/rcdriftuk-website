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
      <Container maxW={400} py={24}>
        <Flex flexDir="column" gap={4}>
          <styled.img w="80%" src="/rcdriftuk.svg" mx="auto" mb={8} />

          <LinkButton to="/map/all" variant="outline" fontSize="lg">
            Find Your Local Track <RiMapPin2Fill />
          </LinkButton>
          <LinkButton to="/calendar" variant="outline" fontSize="lg">
            UK Drift Calendar <RiCalendarFill />
          </LinkButton>
          <LinkButton to="/catalogue" variant="outline" fontSize="lg">
            Shops Catalogue <RiSearchLine />
          </LinkButton>
          <LinkButton to="/ratings" variant="outline" fontSize="lg">
            Driver Ratings <RiListOrdered2 />
          </LinkButton>
          <LinkButton to="/2024/schedule" variant="primary" fontSize="lg">
            🏆 2024 Championship 🏆
          </LinkButton>
        </Flex>

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
