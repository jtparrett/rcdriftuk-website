import { styled, Box, Container, Flex, Spacer } from "~/styled-system/jsx";
import { Link, useParams } from "@remix-run/react";
import { getTabParam } from "~/utils/getTabParam";
import { Tab } from "./Tab";
import { TrackTypes } from "@prisma/client";
import { MainNav } from "./MainNav";

export const MapHeader = () => {
  const params = useParams();
  const tab = getTabParam(params.tab);

  return (
    <Box>
      <Container px={2}>
        <Flex
          gap={2}
          alignItems="center"
          py={4}
          flexDir={{ base: "column", md: "row" }}
        >
          <Link to="/">
            <styled.img w={180} src="/rcdriftuk.svg" />
          </Link>

          <Spacer />

          <MainNav />
        </Flex>

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
    </Box>
  );
};
