import {
  styled,
  Flex,
  Spacer,
  Box,
  Container,
  Center,
} from "~/styled-system/jsx";
import { Link, useLocation } from "react-router";
import { Button, LinkButton } from "./Button";
import { format } from "date-fns";
import {
  RiAddLine,
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
import { SignedIn, SignedOut, useAuth, useUser } from "@clerk/react-router";
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
            bgColor: "gray.800",
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
      borderWidth={1}
      borderColor="gray.800"
      w={{ base: "calc(100% + 32px)", md: "480px" }}
      ml={{ base: -4, md: "auto" }}
      rounded="xl"
      bgColor="gray.900"
      shadow="xl"
    >
      <Box
        bgGradient="to-b"
        gradientFrom="gray.900"
        gradientTo="black"
        rounded="xl"
      >
        {(user?.Tracks.length ?? 0) > 0 && (
          <Box p={3} borderBottomWidth={1} borderColor="gray.800">
            <styled.p fontSize="sm" fontWeight="semibold" mb={1}>
              Your Tracks
            </styled.p>
            <Flex flexWrap="wrap" gap={2}>
              {user?.Tracks.map(({ track }) => (
                <Box key={track.id} w={12} overflow="hidden" textAlign="center">
                  <Box w="full" h={12} overflow="hidden" rounded="full">
                    <Link to={`/tracks/${track.slug}`}>
                      <styled.img
                        src={track.image}
                        w="full"
                        h="full"
                        alt={track.name}
                      />
                    </Link>
                  </Box>
                  <styled.span
                    fontSize="xs"
                    mt={1}
                    w="full"
                    display="block"
                    overflow="hidden"
                    whiteSpace="nowrap"
                    textOverflow="ellipsis"
                  >
                    {track.name}
                  </styled.span>
                </Box>
              ))}

              <Box w={12} textAlign="center">
                <Link to="/tracks/new">
                  <Center w="full" h={12} rounded="full" bgColor="gray.800">
                    <RiAddLine />
                  </Center>
                  <styled.span fontSize="xs" mt={1}>
                    New
                  </styled.span>
                </Link>
              </Box>
            </Flex>
          </Box>
        )}

        <Flex minH="full">
          <Flex gap="1px" flexDir="column" flex={1} p={{ base: 2, md: 4 }}>
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
              active={location.pathname === "/ratings" ? "active" : "inactive"}
            >
              <MenuIcon>
                <RiListOrdered2 />
              </MenuIcon>
              Driver Ratings
            </MenuLink>
            <MenuLink
              to="/competitions"
              active={
                location.pathname.startsWith("/competitions")
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
              active={
                location.pathname.startsWith("/map") ? "active" : "inactive"
              }
            >
              <MenuIcon>
                <RiMapPin2Line />
              </MenuIcon>
              Drift Map
            </MenuLink>
            <MenuLink
              to="/tracks"
              active={location.pathname === "/tracks" ? "active" : "inactive"}
            >
              <MenuIcon>
                <RiFlagLine />
              </MenuIcon>
              Tracks
            </MenuLink>
            <MenuLink
              to={`/calendar/week/${today}`}
              active={
                location.pathname.startsWith("/calendar")
                  ? "active"
                  : "inactive"
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
                location.pathname.startsWith("/merch") ? "active" : "inactive"
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
                location.pathname.startsWith("/catalogue")
                  ? "active"
                  : "inactive"
              }
            >
              <MenuIcon>
                <RiSearch2Line />
              </MenuIcon>
              Catalogue
            </MenuLink>

            <MenuLink
              to="/fdr"
              active={
                location.pathname.startsWith("/fdr") ? "active" : "inactive"
              }
            >
              <MenuIcon>
                <GiCogLock />
              </MenuIcon>
              FDR Calculator
            </MenuLink>

            <MenuLink
              to="/getting-started"
              active={
                location.pathname.startsWith("/getting-started")
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
            <Flex gap="1px" flexDir="column" flex={1} p={{ base: 2, md: 4 }}>
              {user && (
                <MenuLink
                  to={`/tickets`}
                  active={
                    location.pathname.startsWith("/tickets")
                      ? "active"
                      : "inactive"
                  }
                >
                  <MenuIcon>
                    <RiTicketLine />
                  </MenuIcon>
                  My Tickets
                </MenuLink>
              )}

              {user?.driverId && (
                <MenuLink
                  to="/ratings/me"
                  active={
                    location.pathname.startsWith(`/ratings/${user.driverId}`)
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
                  location.pathname.startsWith("/tournaments")
                    ? "active"
                    : "inactive"
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
                  location.pathname.startsWith("/user/profile")
                    ? "active"
                    : "inactive"
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
      </Box>

      <SignedIn>
        <Box p={1} textAlign="center" borderBottomRadius="inherit">
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
      overflow="visible"
      h="65px"
    >
      <Container maxW={1100} px={4}>
        <Flex alignItems="center" h={HEADER_HEIGHT + "px"}>
          <Link to="/">
            <styled.img w={140} src="/rcdriftuk-26.svg" alt="RC Drift UK" />
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
            <Button
              size="sm"
              px={2}
              fontSize="lg"
              variant={menu.isOpen ? "primary" : "outline"}
              onClick={() => menu.toggle()}
              mx={2}
              aria-label="Menu"
              pos="relative"
              overflow="visible"
            >
              <RiMenu2Line />

              {menu.isOpen && (
                <styled.span
                  pos="absolute"
                  top="calc(100% + 9px)"
                  left="50%"
                  w={3}
                  h={3}
                  transform="translateX(-50%) rotate(45deg)"
                  bgColor="gray.900"
                  borderTopWidth={1}
                  borderLeftWidth={1}
                  borderColor="gray.800"
                  borderTopLeftRadius="sm"
                />
              )}
            </Button>
          </Box>

          <SignedIn>
            {user && (
              <styled.div w={8} h={8} rounded="full" overflow="hidden">
                <Link to={`/ratings/${user.driverId}`}>
                  <styled.img src={clerkUser.user?.imageUrl} w="full" />
                </Link>
              </styled.div>
            )}
          </SignedIn>

          <SignedOut>
            <LinkButton variant="outline" size="md" to="/sign-in">
              Sign In
            </LinkButton>
          </SignedOut>
        </Flex>

        {menu.isOpen && <Menu user={user} />}
      </Container>
    </Box>
  );
};
