import { styled, Box, Container, Flex, Spacer } from "~/styled-system/jsx";
import { BsInstagram, BsFacebook } from "react-icons/bs/index.js";
import { Link, useParams } from "@remix-run/react";
import { getTabParam } from "~/utils/getTabParam";
import { Tab } from "./Tab";
import { TrackTypes } from "@prisma/client";

export const MapHeader = () => {
  const params = useParams();
  const tab = getTabParam(params.tab);

  return (
    <Box position="relative" bgColor="black" zIndex={10}>
      <Container>
        <Flex gap={4} alignItems="center" h={75}>
          <Link to="/map/all">
            <styled.img w={180} src="/rcdriftuk.svg" />
          </Link>

          <Spacer />

          <styled.a
            target="_blank"
            fontSize="2xl"
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
        </Box>
      </Container>
    </Box>
  );
};
