import { Box, Flex, styled } from "~/styled-system/jsx";
import {
  RiAccountCircleFill,
  RiAccountCircleLine,
  RiCalendarFill,
  RiCalendarLine,
  RiHomeFill,
  RiHomeLine,
  RiListOrdered2,
  RiMapPin2Fill,
  RiMapPin2Line,
  RiShoppingBagFill,
  RiShoppingBagLine,
  RiVipCrown2Fill,
  RiVipCrown2Line,
} from "react-icons/ri";
import { Link, useLocation } from "react-router";
import { APP_TAB_ROUTES } from "./AppHeader";

const Tab = styled(Link, {
  base: {
    color: "gray.200",
    py: 4,
    px: 2,
  },
  variants: {
    isActive: {
      true: {
        color: "brand.500",
      },
    },
  },
});

export const AppNav = () => {
  const location = useLocation();

  const isMainTab = APP_TAB_ROUTES.some((route) =>
    route.endsWith("*")
      ? location.pathname.toLowerCase().startsWith(route.slice(0, -1))
      : location.pathname.toLowerCase() === route,
  );

  if (!isMainTab) {
    return null;
  }

  return (
    <>
      <Box h="calc(64px + env(safe-area-inset-bottom))" w="full" />
      <Flex
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        borderTopWidth={1}
        borderColor="gray.800"
        zIndex={15}
        bgColor="rgba(12, 12, 12, 0.75)"
        backdropFilter="blur(10px)"
        pb="env(safe-area-inset-bottom)"
      >
        <Flex
          w="full"
          h="64px"
          px={2}
          justifyContent="space-between"
          alignItems="center"
        >
          <Tab
            to="/app"
            isActive={
              location.pathname === "/feed" || location.pathname === "/"
            }
            viewTransition
          >
            {location.pathname === "/feed" || location.pathname === "/" ? (
              <RiHomeFill size={24} />
            ) : (
              <RiHomeLine size={24} />
            )}
          </Tab>
          <Tab
            to="/ratings"
            isActive={location.pathname.startsWith("/ratings")}
            viewTransition
          >
            <RiListOrdered2 size={24} />
          </Tab>
          <Tab
            to="/tournaments"
            isActive={location.pathname.startsWith("/tournaments")}
            viewTransition
          >
            {location.pathname.startsWith("/tournaments") ? (
              <RiVipCrown2Fill size={24} />
            ) : (
              <RiVipCrown2Line size={24} />
            )}
          </Tab>
          <Tab
            to="/map"
            isActive={location.pathname.startsWith("/map")}
            viewTransition
          >
            {location.pathname.startsWith("/map") ? (
              <RiMapPin2Fill size={24} />
            ) : (
              <RiMapPin2Line size={24} />
            )}
          </Tab>
          <Tab
            to="/calendar"
            isActive={location.pathname.startsWith("/calendar")}
            viewTransition
          >
            {location.pathname.startsWith("/calendar") ? (
              <RiCalendarFill size={24} />
            ) : (
              <RiCalendarLine size={24} />
            )}
          </Tab>
          <Tab
            to="/marketplace"
            isActive={location.pathname.startsWith("/marketplace")}
            viewTransition
          >
            {location.pathname.startsWith("/marketplace") ? (
              <RiShoppingBagFill size={24} />
            ) : (
              <RiShoppingBagLine size={24} />
            )}
          </Tab>
          <Tab
            to="/user-menu"
            isActive={location.pathname.startsWith("/user-menu")}
            viewTransition
          >
            {location.pathname.startsWith("/user-menu") ? (
              <RiAccountCircleFill size={24} />
            ) : (
              <RiAccountCircleLine size={24} />
            )}
          </Tab>
        </Flex>
      </Flex>
    </>
  );
};
