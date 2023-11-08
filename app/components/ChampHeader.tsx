import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { LinkButton } from "./Button";
import { Tab } from "./Tab";
import { Link, useLocation } from "@remix-run/react";
import { BsFillRecordCircleFill } from "react-icons/bs/index.js";

export const ChampHeader = () => {
  const location = useLocation();

  return (
    <Box position="sticky" bgColor="black" zIndex={10} top={0}>
      <Container>
        <Flex alignItems="center" h={75}>
          <Link to="/2024/schedule">
            <styled.img
              src="/2024-logo.svg"
              w={160}
              alt="RC Drift UK 2024 Championship"
            />
          </Link>

          <Spacer />

          <LinkButton to="/2024/live" ml={4}>
            Watch Live <BsFillRecordCircleFill />
          </LinkButton>
        </Flex>

        <Box
          position={{
            md: "absolute",
          }}
          top="50%"
          left="50%"
          transform={{
            md: "translateX(-50%) translateY(-50%)",
          }}
          paddingBottom={{
            base: 4,
            md: 0,
          }}
        >
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
        </Box>
      </Container>
    </Box>
  );
};
