import {
  styled,
  Flex,
  Spacer,
  Box,
  Container,
  Center,
} from "~/styled-system/jsx";
import { Link, useLocation, useNavigation } from "react-router";
import { Button, LinkButton } from "./Button";
import { RiAddCircleFill, RiAddLine, RiMenuFill } from "react-icons/ri";
import { useEffect, useState } from "react";
import { useDisclosure } from "~/utils/useDisclosure";
import { SignedIn, SignedOut } from "@clerk/react-router";
import type { GetUser } from "~/utils/getUser.server";
import { Menu, UserMenu } from "./Menu";
import { UserTracks } from "./UserTracks";

export const HEADER_HEIGHT = 64;

export function useDelayedLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (navigation.state === "loading") {
      timer = setTimeout(() => setIsLoading(true), 150);
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
        {user && <UserTracks user={user} />}

        <Flex minH="full">
          <Flex gap="1px" flexDir="column" flex={1} p={{ base: 2, md: 4 }}>
            <Menu />
          </Flex>

          <SignedIn>
            <Box w="1px" bgColor="gray.800" />
            <Flex gap="1px" flexDir="column" flex={1} p={{ base: 2, md: 4 }}>
              <UserMenu />
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
  const isNavigating = useDelayedLoader();

  useEffect(() => {
    menu.onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
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
      <Container maxW={1100} w="full" px={4} h="64px">
        <Flex alignItems="center" h={HEADER_HEIGHT + "px"} gap={2}>
          <Link to="/" viewTransition>
            <styled.img w={140} src="/rcdriftuk-26.svg" alt="RC Drift UK" />
          </Link>

          {isNavigating && (
            <Box
              w={5}
              h={5}
              rounded="full"
              borderWidth={2}
              borderColor="gray.800"
              borderTopColor="brand.500"
              animation="spin 1s linear infinite"
            />
          )}

          <Spacer />

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

          <SignedIn>
            {user && (
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
            )}
          </SignedIn>

          <SignedOut>
            <LinkButton variant="outline" size="md" to="/sign-in">
              Sign In
            </LinkButton>
          </SignedOut>
        </Flex>

        {menu.isOpen && <MenuDropdown user={user} />}
      </Container>
    </Flex>
  );
};
