import { Box, Flex, Spacer, styled } from "~/styled-system/jsx";
import { useDelayedLoader } from "./Header";
import { useLocation, useNavigate } from "react-router";
import { Button } from "./Button";
import { RiArrowLeftSLine } from "react-icons/ri";
import { Regions } from "~/utils/enums";

const TAB_ROUTES = [
  "/",
  "/ratings/*",
  "/map/*",
  "/calendar/*",
  "/marketplace",
  "/user-menu",
  "/sign-in",
  "/sign-up",
];

export const AppHeader = () => {
  const isNavigating = useDelayedLoader();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <Flex
        pos="fixed"
        top="-135px"
        w="full"
        zIndex={15}
        bgColor="rgba(12, 12, 12, 0.75)"
        backdropFilter="blur(10px)"
        shadow="2xl"
        borderBottomWidth={1}
        borderColor="gray.900"
        flexDir="column"
        justifyContent="flex-end"
        h="200px"
        transform="translate3d(0, 0, 0)"
      >
        <Flex h="65px" alignItems="center" px={4} pos="relative">
          {!TAB_ROUTES.some((route) =>
            route.endsWith("*")
              ? location.pathname.toLowerCase().startsWith(route.slice(0, -1))
              : location.pathname.toLowerCase() === route,
          ) && (
            <styled.button onClick={() => navigate(-1)} type="button">
              <RiArrowLeftSLine size={24} />
            </styled.button>
          )}

          <Spacer />

          <styled.img
            w={140}
            src="/rcdriftuk-26.svg"
            alt="RC Drift UK"
            pos="absolute"
            left="50%"
            transform="translate(-50%, -50%)"
            top="50%"
          />

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
        </Flex>
      </Flex>

      <Box h="65px" w="full" />
    </>
  );
};
