import { MetaFunction } from "@remix-run/node";
import { BsFacebook, BsInstagram } from "react-icons/bs/index.js";
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
      gradientFrom="brand-700"
      gradientVia="transparent"
      gradientTo="transparent"
    >
      <Container maxW={400} py={24}>
        <Flex flexDir="column" gap={4}>
          <styled.img w="80%" src="/rcdriftuk.svg" mx="auto" mb={8} />

          <LinkButton to="/map/all" variant="outline" fontSize="lg">
            Find Your Local Track 📍
          </LinkButton>
          <LinkButton to="/calendar" variant="outline" fontSize="lg">
            Drift Calendar 🗓️
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
            <BsFacebook />
          </styled.a>

          <styled.a
            target="_blank"
            fontSize="2xl"
            href="https://www.instagram.com/rcdriftuk"
          >
            <BsInstagram />
          </styled.a>
        </Flex>
      </Container>
    </Box>
  );
};

export default Page;
