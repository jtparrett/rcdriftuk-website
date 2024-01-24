import { TrackTypes } from "@prisma/client";
import { Outlet, useParams } from "@remix-run/react";
import { Header } from "~/components/Header";
import { Tab } from "~/components/Tab";
import { Box, Container, Flex } from "~/styled-system/jsx";
import { getTabParam } from "~/utils/getTabParam";

const Page = () => {
  const params = useParams();
  const tab = getTabParam(params.tab);

  return (
    <Flex h="100dvh" flexDir="column">
      <Header />

      <Container px={2} w="full">
        <Flex p={1} bgColor="gray.800" rounded="lg" gap={2} mb={2}>
          {Object.values(TrackTypes).map((item) => (
            <Tab
              key={item}
              isActive={item === tab}
              to={`/map/${item.toLowerCase()}`}
            >
              {item.toLowerCase()}
            </Tab>
          ))}
        </Flex>
      </Container>

      <Box pos="relative" flex={1}>
        <Outlet />
      </Box>
    </Flex>
  );
};

export default Page;
