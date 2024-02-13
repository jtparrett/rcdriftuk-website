import { styled, Flex, Spacer, Container, Box } from "~/styled-system/jsx";
import { Link, useLocation } from "@remix-run/react";
import { Button, LinkButton } from "./Button";
import { format } from "date-fns";
import {
  RiCalendar2Line,
  RiFacebookFill,
  RiInstagramFill,
  RiListOrdered2,
  RiMapPin2Line,
  RiMenu2Line,
  RiSearch2Line,
  RiTrophyLine,
} from "react-icons/ri";
import { useEffect } from "react";
import { useDisclosure } from "~/utils/useDisclosure";
import { Popover } from "react-tiny-popover";

const today = format(new Date(), "dd-MM-yy");

const MenuIcon = styled("span", {
  base: {
    rounded: "md",
    bgColor: "rgba(255, 255, 255, 0.2)",
    w: 7,
    h: 7,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    shadow: "md",
  },
});

const MenuLink = styled(Link, {
  base: {
    rounded: "lg",
    py: 2,
    pl: 2,
    pr: 3,
    display: "flex",
    gap: 3,
    alignItems: "center",
    fontSize: "sm",
    fontWeight: "semibold",
  },
  variants: {
    active: {
      inactive: {
        _hover: {
          bgColor: "gray.900",
        },
      },
      active: {
        bgColor: "brand.500",
      },
    },
  },
  defaultVariants: {
    active: "inactive",
  },
});

const Menu = () => {
  return (
    <Box
      bgColor="rgba(0, 0, 0, 0.8)"
      backdropFilter="blur(10px)"
      rounded="lg"
      borderWidth={1}
      borderColor="gray.800"
      shadow="2xl"
      mt={5}
      p={{ base: 2, md: 4 }}
    >
      <Flex gap={1} flexDir="column">
        <MenuLink
          to="/map/all"
          active={location.pathname.includes("/map") ? "active" : "inactive"}
        >
          <MenuIcon>
            <RiMapPin2Line />
          </MenuIcon>
          Drift Map
        </MenuLink>
        <MenuLink
          to={`/calendar/week/${today}`}
          active={
            location.pathname.includes("/calendar") ? "active" : "inactive"
          }
        >
          <MenuIcon>
            <RiCalendar2Line />
          </MenuIcon>
          Drift Calendar
        </MenuLink>
        <MenuLink
          to="/catalogue"
          active={
            location.pathname.includes("/catalogue") ? "active" : "inactive"
          }
        >
          <MenuIcon>
            <RiSearch2Line />
          </MenuIcon>
          Shops Catalogue
        </MenuLink>
        <MenuLink
          to="/2024/schedule"
          active={location.pathname.includes("/2024") ? "active" : "inactive"}
        >
          <MenuIcon>
            <RiTrophyLine />
          </MenuIcon>
          2024 Championship
        </MenuLink>
        <MenuLink
          to="/ratings"
          active={
            location.pathname.includes("/ratings") ? "active" : "inactive"
          }
        >
          <MenuIcon>
            <RiListOrdered2 />
          </MenuIcon>
          Driver Ratings
        </MenuLink>
      </Flex>
    </Box>
  );
};

export const Header = () => {
  const location = useLocation();
  const menu = useDisclosure();

  useEffect(() => {
    menu.onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return (
    <Box
      pt={{ base: 2, md: 0 }}
      borderBottomWidth={1}
      borderColor="gray.800"
      pos="sticky"
      top={0}
      zIndex={10}
      bgColor="rgba(0, 0, 0, 0.8)"
      backdropFilter="blur(10px)"
      shadow="2xl"
    >
      <Container px={2} maxW={1100}>
        <Flex alignItems="center" py={5}>
          <Link to="/">
            <styled.img w={140} src="/rcdriftuk.svg" />
          </Link>

          <Spacer />

          <LinkButton
            size="sm"
            px={2}
            fontSize="lg"
            target="_blank"
            variant="ghost"
            to="https://www.facebook.com/RCDriftingUK/"
          >
            <RiFacebookFill />
          </LinkButton>

          <LinkButton
            size="sm"
            px={2}
            fontSize="lg"
            target="_blank"
            variant="ghost"
            to="https://www.instagram.com/rcdriftuk"
          >
            <RiInstagramFill />
          </LinkButton>

          <Box>
            <Popover
              isOpen={menu.isOpen}
              content={<Menu />}
              positions={["bottom"]}
              align="end"
              containerStyle={{
                zIndex: "20",
              }}
            >
              <Button
                size="sm"
                px={2}
                fontSize="lg"
                variant={menu.isOpen ? "primary" : "ghost"}
                onClick={() => menu.toggle()}
              >
                <RiMenu2Line />
              </Button>
            </Popover>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};
