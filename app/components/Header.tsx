import { styled, Flex, Spacer, Box, Container } from "~/styled-system/jsx";
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
  RiLogoutBoxRLine,
  RiMapPin2Line,
  RiMenu2Line,
  RiRocketLine,
  RiSearch2Line,
  RiSettings3Line,
  RiShoppingBagLine,
  RiTicketLine,
  RiTrophyLine,
  RiUserLine,
  RiVipCrown2Line,
} from "react-icons/ri";
import { GiCogLock } from "react-icons/gi";
import { useEffect } from "react";
import { useDisclosure } from "~/utils/useDisclosure";
import { Popover } from "react-tiny-popover";
import { SignedIn, SignedOut, useAuth, useUser } from "@clerk/remix";
import type { GetUser } from "~/utils/getUser.server";

const today = format(new Date(), "dd-MM-yy");

export const HEADER_HEIGHT = 64;

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
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
    maxW: "full",
  },
  variants: {
    active: {
      inactive: {
        _hover: {
          md: {
            bgColor: "gray.900",
          },
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

const Menu = ({ user }: Props) => {
  const { signOut } = useAuth();

  return (
    <Box
      bgColor="rgba(12, 12, 12, 0.8)"
      backdropFilter="blur(10px)"
      rounded="xl"
      borderWidth={1}
      borderColor="gray.800"
      shadow="2xl"
      mt={5}
      overflow="hidden"
      w={{ base: "100vw", sm: "auto" }}
    >
      <Flex gap={2} p={{ base: 2, md: 4 }}>
        <Flex gap={1} flexDir="column" flex={1}>
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
              location.pathname.includes("/competitions")
                ? "active"
                : "inactive"
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
            active={
              location.pathname.includes("/tracks") ? "active" : "inactive"
            }
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
            to="/merch"
            active={
              location.pathname.includes("/merch") ? "active" : "inactive"
            }
          >
            <MenuIcon>
              <RiShoppingBagLine />
            </MenuIcon>
            Merch
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
            to="/fdr"
            active={location.pathname.includes("/fdr") ? "active" : "inactive"}
          >
            <MenuIcon>
              <GiCogLock />
            </MenuIcon>
            FDR Calculator
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

        <SignedIn>
          <Box w="1px" bgColor="gray.800" />
          <Flex gap={1} flexDir="column" flex={1}>
            {user?.track && (
              <MenuLink to={`/tracks/${user.track.slug}`} active="inactive">
                <MenuIcon>
                  <RiFlagLine />
                </MenuIcon>
                My Track
              </MenuLink>
            )}

            {user && (
              <MenuLink to={`/tickets`} active="inactive">
                <MenuIcon>
                  <RiTicketLine />
                </MenuIcon>
                My Tickets
              </MenuLink>
            )}

            {user?.driverId && (
              <MenuLink
                to={`/ratings/${user.driverId}`}
                active={
                  location.pathname.includes(`/ratings/${user.driverId}`)
                    ? "active"
                    : "inactive"
                }
              >
                <MenuIcon>
                  <RiUserLine />
                </MenuIcon>
                My Driver Profile
              </MenuLink>
            )}

            <MenuLink
              to="/tournaments"
              active={
                location.pathname === "/tournaments" ? "active" : "inactive"
              }
            >
              <MenuIcon>
                <RiVipCrown2Line />
              </MenuIcon>
              My Tournaments
            </MenuLink>

            <MenuLink
              to="/user/profile"
              active={
                location.pathname === "/user/profile" ? "active" : "inactive"
              }
            >
              <MenuIcon>
                <RiSettings3Line />
              </MenuIcon>
              Account Settings
            </MenuLink>

            <MenuLink
              to="/"
              onClick={(e) => {
                e.preventDefault();
                signOut();
              }}
            >
              <MenuIcon>
                <RiLogoutBoxRLine />
              </MenuIcon>
              Sign Out
            </MenuLink>
          </Flex>
        </SignedIn>
      </Flex>

      <SignedIn>
        <Box bgColor="gray.900" p={1} textAlign="center">
          <styled.span
            fontWeight="semibold"
            fontSize="xs"
            color="gray.500"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
            overflow="hidden"
            maxW="full"
          >
            You're logged in as {user?.firstName ?? "..."} {user?.lastName}
          </styled.span>
        </Box>
      </SignedIn>
    </Box>
  );
};

interface Props {
  user: GetUser | null;
}

export const Header = ({ user }: Props) => {
  const location = useLocation();
  const menu = useDisclosure();
  const clerkUser = useUser();

  useEffect(() => {
    menu.onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return (
    <Box
      pos="sticky"
      top={0}
      zIndex={10}
      bgColor="rgba(12, 12, 12, 0.8)"
      backdropFilter="blur(10px)"
      shadow="2xl"
      borderBottomWidth={1}
      borderColor="gray.900"
    >
      <Container maxW={1100} px={4}>
        <Flex alignItems="center" h={HEADER_HEIGHT + "px"}>
          <Link to="/">
            <styled.img w={100} src="/rcdriftuk.svg" />
          </Link>

          <Spacer />

          <LinkButton
            size="sm"
            px={2}
            fontSize="lg"
            target="_blank"
            variant="ghost"
            to="https://www.facebook.com/rcdriftinternational/"
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
              content={<Menu user={user} />}
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

          <SignedIn>
            <styled.div w={8} h={8} rounded="full" overflow="hidden">
              <styled.img src={clerkUser.user?.imageUrl} w="full" />
            </styled.div>
          </SignedIn>

          <SignedOut>
            <LinkButton
              variant="outline"
              size="md"
              to="/sign-in"
              rounded="full"
            >
              Sign In
            </LinkButton>
          </SignedOut>
        </Flex>
      </Container>
    </Box>
  );
};
