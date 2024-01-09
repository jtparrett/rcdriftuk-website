import { Outlet } from "@remix-run/react";
import { MapHeader } from "~/components/MapHeader";
import { Box, Flex } from "~/styled-system/jsx";

const Page = () => {
  return (
    <Flex h="100dvh" flexDir="column">
      <MapHeader />
      <Box pos="relative" flex={1}>
        <Outlet />
      </Box>
    </Flex>
  );
};

export default Page;
