import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { LinkButton } from "./Button";
import { Tab } from "./Tab";
import { Link, useLocation } from "@remix-run/react";
import { BsFillRecordCircleFill } from "react-icons/bs/index.js";
import { MainNav } from "./MainNav";

export const ChampHeader = () => {
  const location = useLocation();

  return (
    <Box position="sticky" bgColor="black" zIndex={10} top={0}>
      <Container px={2}>
        <Flex alignItems="center" py={4} gap={2}>
          <Link to="/">
            <styled.img
              src="/2024-logo.svg"
              w={160}
              alt="RC Drift UK 2024 Championship"
            />
          </Link>

          <Spacer />

          <MainNav />

          <LinkButton to="/2024/live" ml={4}>
            Watch Live <BsFillRecordCircleFill />
          </LinkButton>
        </Flex>

        <Flex p={1} bgColor="gray.800" rounded="lg" gap={2}>
          <Tab
            to="/2024/schedule"
            isActive={
              location.pathname === "/2024/schedule" ||
              location.pathname === "/2024/schedule/"
            }
          >
            Schedule
          </Tab>
          <Tab
            to="/2024/standings"
            isActive={location.pathname.startsWith("/2024/standings")}
          >
            Standings
          </Tab>
        </Flex>
      </Container>
    </Box>
  );
};
