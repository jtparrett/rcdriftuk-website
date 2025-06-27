import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { Outlet, useLocation } from "react-router";
import { Tab } from "~/components/Tab";

const Page = () => {
  const location = useLocation();

  return (
    <styled.main>
      <Box
        borderBottomWidth={1}
        borderColor="gray.900"
        pos="sticky"
        top="65px"
        zIndex={10}
        bgColor="rgba(12, 12, 12, 0.75)"
        backdropFilter="blur(10px)"
      >
        <Container px={2} maxW={1100}>
          <Box overflowX="auto" w="full">
            <Flex gap={2} py={2} alignItems="center">
              <Tab
                to="/2025"
                isActive={location.pathname.replaceAll(/\//g, "") === "2025"}
              >
                Overview
              </Tab>
              <Tab
                to="/2025/schedule"
                isActive={location.pathname.startsWith("/2025/schedule")}
              >
                Schedule
              </Tab>
              <Tab
                to="/2025/standings"
                isActive={location.pathname.startsWith("/2025/standings")}
              >
                Standings
              </Tab>
              <Tab
                to="/2025/rules"
                isActive={location.pathname.startsWith("/2025/rules")}
              >
                Rules & Regs
              </Tab>
              <Tab
                to="/2025/judging-criteria"
                isActive={location.pathname.startsWith(
                  "/2025/judging-criteria",
                )}
              >
                Judging Criteria
              </Tab>
            </Flex>
          </Box>
        </Container>
      </Box>
      <Outlet />
    </styled.main>
  );
};

export default Page;
