import { styled, Flex, Spacer, Box, Container } from "~/styled-system/jsx";
import { Link, useLocation, useNavigation } from "react-router";
import { Button, LinkButton } from "./Button";
import { RiMenuFill, RiNotificationLine } from "react-icons/ri";
import { useEffect, useState } from "react";
import { useDisclosure } from "~/utils/useDisclosure";
import { SignedOut } from "@clerk/react-router";
import type { GetUser } from "~/utils/getUser.server";
import { Menu, UserMenu } from "./Menu";
import { UserTracks } from "./UserTracks";
import { NotificationsBadge } from "./NotificationsBadge";
import { Spinner } from "./Spinner";
import { useTheme } from "~/utils/theme";
import { TabsBar } from "./TabsBar";
import { Tab } from "./Tab";

export const HEADER_HEIGHT = 64;

export function useDelayedLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (navigation.state === "loading") {
      timer = setTimeout(() => setIsLoading(true), 200);
    } else {
      setIsLoading(false);
    }
    return () => clearTimeout(timer);
  }, [navigation.state]);

  return isLoading;
}

const MenuDropdown = ({ user }: Props) => {
  return (
    <Box
      borderWidth={1}
      borderColor="gray.800"
      w={{ base: "calc(100% + 16px)", md: "480px" }}
      ml={{ base: -2, md: "auto" }}
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
        {user && <UserTracks user={user} />}

        <Flex minH="full">
          <Flex gap="1px" flexDir="column" flex={1} p={{ base: 2, md: 4 }}>
            <Menu />
          </Flex>

          {user && (
            <>
              <Box w="1px" bgColor="gray.800" />
              <Flex gap="1px" flexDir="column" flex={1} p={{ base: 2, md: 4 }}>
                <UserMenu />
              </Flex>
            </>
          )}
        </Flex>
      </Box>

      {user && (
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
      )}
    </Box>
  );
};

interface Props {
  user: GetUser | null;
}

export const Header = ({ user }: Props) => {
  const theme = useTheme();
  const location = useLocation();
  const menu = useDisclosure();
  const isNavigating = useDelayedLoader();

  useEffect(() => {
    menu.onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      <Flex
        pos="sticky"
        top="-136px"
        zIndex={15}
        bgColor="rgba(12, 12, 12, 0.75)"
        backdropFilter="blur(10px)"
        shadow="2xl"
        borderBottomWidth={1}
        borderColor="gray.900"
        overflow="visible"
        h="200px"
        mt="-136px"
        flexDir="column"
        justifyContent="flex-end"
        transform="translate3d(0, 0, 0)"
      >
        <Container maxW={1100} w="full" px={2} h="64px">
          <Flex alignItems="center" h={HEADER_HEIGHT + "px"} gap={1}>
            <Link to="/">
              <styled.img w={140} src={theme?.logoUrl} alt={theme?.name} />
            </Link>

            {isNavigating && <Spinner />}

            <Spacer />

            {theme?.showMenu && (
              <Box>
                <Button
                  size="sm"
                  variant={menu.isOpen ? "primary" : "outline"}
                  onClick={() => menu.toggle()}
                  aria-label="Menu"
                  pos="relative"
                  overflow="visible"
                >
                  <RiMenuFill />
                  Menu
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
            )}

            {user && (
              <>
                <LinkButton
                  to="/notifications"
                  pos="relative"
                  w={10}
                  h={10}
                  variant="outline"
                  px={0}
                  py={0}
                >
                  <RiNotificationLine size={16} />
                  <styled.span srOnly>Notifications</styled.span>
                  <NotificationsBadge />
                </LinkButton>

                {/* <LinkButton
                to="/inbox"
                pos="relative"
                w={10}
                h={10}
                variant="outline"
                px={0}
                py={0}
              >
                <RiChat3Line size={16} />
                <styled.span srOnly>Inbox</styled.span>
              </LinkButton> */}

                <Link to={`/drivers/${user.driverId}`}>
                  <styled.div
                    w={10}
                    h={10}
                    rounded="full"
                    overflow="hidden"
                    borderWidth={1}
                    borderColor="gray.800"
                  >
                    <styled.img
                      src={user.image ?? "/blank-driver-right.jpg"}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                  </styled.div>
                </Link>
              </>
            )}

            <SignedOut>
              <LinkButton variant="outline" size="md" to="/sign-in">
                Sign In
              </LinkButton>
            </SignedOut>
          </Flex>

          {menu.isOpen && <MenuDropdown user={user} />}
        </Container>
      </Flex>

      {theme?.key === "sdc" && (
        <TabsBar>
          <Tab to="/" isActive={location.pathname === "/"}>
            Overview
          </Tab>
          <Tab to="/sdc">Schedule</Tab>
          <Tab to="/sdc">Standings</Tab>
          <Tab to="/sdc">Rules & Regs</Tab>
        </TabsBar>
      )}
    </>
  );
};
