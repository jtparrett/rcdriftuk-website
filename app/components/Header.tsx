import { styled, Box, Container, Flex, Spacer } from "~/styled-system/jsx";
import { BsInstagram, BsFacebook } from "react-icons/bs/index.js";
import { ReactNode } from "react";
import { Link, useParams } from "@remix-run/react";
import { getTabParam } from "~/utils/getTabParam";

interface Props {
  children: ReactNode;
  isActive?: boolean;
  to: string;
}

const TabBase = styled(Link);

const Tab = ({ children, isActive, to }: Props) => {
  return (
    <TabBase
      to={to}
      px={2}
      py={1}
      textTransform="capitalize"
      bgColor={isActive ? "black" : undefined}
      rounded="sm"
      fontWeight={isActive ? "semibold" : undefined}
      transition="all .3s"
    >
      {children}
    </TabBase>
  );
};

export const HEADER_TABS = {
  ALL: "all",
  TRACKS: "tracks",
  CLUBS: "clubs",
  SHOPS: "shops",
} as const;

export const Header = () => {
  const params = useParams();
  const tab = getTabParam(params.tab);

  return (
    <Box position="relative" bgColor="black" zIndex={10}>
      <Container>
        <Flex gap={4} alignItems="center" h={75}>
          <styled.img w={180} src="/rcdriftuk.svg" />

          <Spacer />

          <styled.a fontSize="2xl" href="https://www.facebook.com/RCDr1ftUK/">
            <BsFacebook />
          </styled.a>

          <styled.a fontSize="2xl" href="https://www.instagram.com/rcdriftuk">
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
          <Flex p={1} bgColor="gray.800" rounded="md" gap={2}>
            {Object.values(HEADER_TABS).map((item) => (
              <Tab key={item} isActive={item === tab} to={`/${item}`}>
                {item}
              </Tab>
            ))}
          </Flex>
        </Box>
      </Container>
    </Box>
  );
};
