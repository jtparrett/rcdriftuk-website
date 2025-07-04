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
} from "react-icons/ri";
import { Link, useLocation } from "react-router";

const Tab = styled(Link, {
  base: {
    color: "gray.200",
    py: 4,
    px: 4,
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

  return (
    <>
      <Box h="calc(64px + var(--spacing-4))" w="full" />
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
        px={4}
      >
        <Flex
          w="full"
          h="64px"
          justifyContent="space-between"
          alignItems="center"
        >
          <Tab to="/" isActive={location.pathname === "/"} viewTransition>
            {location.pathname === "/" ? (
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
