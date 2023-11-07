import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { LinkButton } from "./Button";
import { Tab } from "./Tab";
import { Link, useLocation } from "@remix-run/react";
import { NEXT_EVENT } from "~/utils/consts/nextEvent";

export const ChampHeader = () => {
  const location = useLocation();

  return (
    <Box position="relative" bgColor="black" zIndex={10}>
      <Container>
        <Flex alignItems="center" h={75}>
          <Link to={`/2024/schedule/${NEXT_EVENT}`}>
            <styled.img
              src="/2024-logo.svg"
              w={160}
              alt="RC Drift UK 2024 Championship"
            />
          </Link>

          <Spacer />

          <LinkButton to="/2024/live" ml={4}>
            Watch Live
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
          <Flex p={1} bgColor="gray.800" rounded="md" gap={2}>
            <Tab
              to={`/2024/schedule/${NEXT_EVENT}`}
              isActive={location.pathname.startsWith("/2024/schedule")}
            >
              Schedule
            </Tab>
            <Tab
              to="/2024/points"
              isActive={location.pathname.startsWith("/2024/points")}
            >
              Points
            </Tab>
          </Flex>
        </Box>
      </Container>
    </Box>
  );
};
