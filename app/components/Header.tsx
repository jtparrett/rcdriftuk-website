import { styled, Flex, Spacer, Container, Box } from "~/styled-system/jsx";
import { Link, useLocation } from "@remix-run/react";
import { Button, LinkButton } from "./Button";
import { format } from "date-fns";
import {
  RiCalendar2Line,
  RiFacebookFill,
  RiFlagLine,
  RiHome2Line,
  RiInstagramFill,
  RiListOrdered2,
  RiMapPin2Line,
  RiMenu2Line,
  RiRocketLine,
  RiSearch2Line,
  RiTrophyLine,
} from "react-icons/ri";
import { useEffect } from "react";
import { useDisclosure } from "~/utils/useDisclosure";
import { Popover } from "react-tiny-popover";
import { SignedOut, useAuth, useUser } from "@clerk/remix";
import type { GetUser } from "~/utils/getUser.server";

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
      bgColor="rgba(12, 12, 12, 0.8)"
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
          to="/"
          active={location.pathname === "/" ? "active" : "inactive"}
        >
          <MenuIcon>
            <RiHome2Line />
          </MenuIcon>
          Home
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
        <MenuLink
          to="/competitions"
          active={
            location.pathname.includes("/competitions") ? "active" : "inactive"
          }
        >
          <MenuIcon>
            <RiTrophyLine />
          </MenuIcon>
          Competitions
        </MenuLink>
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
          to="/tracks"
          active={location.pathname.includes("/tracks") ? "active" : "inactive"}
        >
          <MenuIcon>
            <RiFlagLine />
          </MenuIcon>
          Tracks
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
          Calendar
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
          Catalogue
        </MenuLink>

        <MenuLink
          to="/getting-started"
          active={
            location.pathname.includes("/getting-started")
              ? "active"
              : "inactive"
          }
        >
          <MenuIcon>
            <RiRocketLine />
          </MenuIcon>
          Getting Started
        </MenuLink>
      </Flex>
    </Box>
  );
};

const UserMenu = ({ user }: Props) => {
  const { signOut } = useAuth();

  return (
    <Box
      bgColor="rgba(12, 12, 12, 0.8)"
      backdropFilter="blur(10px)"
      rounded="lg"
      borderWidth={1}
      borderColor="gray.800"
      shadow="2xl"
      mt={5}
      p={{ base: 2, md: 4 }}
    >
      <Flex gap={1} flexDir="column">
        {user?.track && (
          <MenuLink to={`/tracks/${user.track.slug}`} active="inactive">
            My Track
          </MenuLink>
        )}

        <MenuLink
          to="/tournaments"
          active={location.pathname === "/tournaments" ? "active" : "inactive"}
        >
          My Tournaments
        </MenuLink>

        <MenuLink
          to="/user/profile"
          active={location.pathname === "/user/profile" ? "active" : "inactive"}
        >
          Account Settings
        </MenuLink>

        <MenuLink
          to="/"
          onClick={(e) => {
            e.preventDefault();
            signOut();
          }}
        >
          Sign Out
        </MenuLink>
      </Flex>
    </Box>
  );
};

interface Props {
  user: GetUser | null;
}

export const Header = ({ user }: Props) => {
  const location = useLocation();
  const menu = useDisclosure();
  const userMenu = useDisclosure();
  const clerkUser = useUser();

  useEffect(() => {
    menu.onClose();
    userMenu.onClose();
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
      bgColor="rgba(12, 12, 12, 0.8)"
      backdropFilter="blur(10px)"
      shadow="2xl"
    >
      <Container px={2} maxW={1100}>
        <Flex alignItems="center" py={5}>
          <Link to="/">
            <styled.img w={120} src="/rcdriftuk.svg" />
          </Link>

          <Spacer />

          <LinkButton
            size="sm"
            px={2}
            fontSize="lg"
            target="_blank"
            variant="ghost"
            to="https://www.facebook.com/DriftRCUK/"
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
              onClickOutside={menu.onClose}
            >
              <Button
                size="sm"
                px={2}
                fontSize="lg"
                variant={menu.isOpen ? "primary" : "outline"}
                onClick={() => menu.toggle()}
                mx={2}
                aria-label="Menu"
              >
                <RiMenu2Line />
              </Button>
            </Popover>
          </Box>

          {user !== null && (
            <Popover
              isOpen={userMenu.isOpen}
              content={<UserMenu user={user} />}
              positions={["bottom"]}
              align="end"
              containerStyle={{
                zIndex: "20",
              }}
              onClickOutside={userMenu.onClose}
            >
              <styled.button
                w={8}
                h={8}
                rounded="full"
                overflow="hidden"
                type="button"
                cursor="pointer"
                onClick={() => userMenu.toggle()}
              >
                <styled.img src={clerkUser.user?.imageUrl} w="full" />
              </styled.button>
            </Popover>
          )}

          <SignedOut>
            <LinkButton variant="outline" size="sm" to="/sign-in">
              Sign In
            </LinkButton>
          </SignedOut>
        </Flex>
      </Container>
    </Box>
  );
};
