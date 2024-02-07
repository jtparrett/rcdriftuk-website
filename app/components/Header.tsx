import { styled, Flex, Spacer, Container, Box } from "~/styled-system/jsx";
import { Link } from "@remix-run/react";
import { MainNav } from "./MainNav";

export const Header = () => {
  return (
    <Box
      mb={2}
      pt={{ base: 2, md: 0 }}
      borderBottomWidth={1}
      borderColor="gray.800"
      pos="sticky"
      top={0}
      zIndex={10}
      bgColor="rgba(0, 0, 0, 0.8)"
      backdropFilter="blur(10px)"
      shadow="2xl"
    >
      <Container px={2} maxW={1100}>
        <Flex
          gap={2}
          alignItems="center"
          py={{ base: 2, md: 4 }}
          flexDir={{ base: "column", md: "row" }}
        >
          <Link to="/">
            <styled.img w={160} src="/rcdriftuk.svg" />
          </Link>

          <Spacer />

          <MainNav />
        </Flex>
      </Container>
    </Box>
  );
};
