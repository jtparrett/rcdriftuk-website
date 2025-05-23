import { TrackTypes } from "~/utils/enums";
import { Outlet, useParams } from "react-router";
import { Tab } from "~/components/Tab";
import { Box, Container, Flex } from "~/styled-system/jsx";
import { getTabParam } from "~/utils/getTabParam";

const Page = () => {
  const params = useParams();
  const tab = getTabParam(params.tab);

  return (
    <Flex h="calc(100dvh - 100px)" flexDir="column">
      <Container px={2} w="full" maxW={1100}>
        <Flex gap={0.5} py={2}>
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
