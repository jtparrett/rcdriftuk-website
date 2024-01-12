import { useLocation } from "@remix-run/react";
import { Flex, Box, Spacer } from "~/styled-system/jsx";
import { LinkButton } from "./Button";
import {
  RiCalendarFill,
  RiFacebookFill,
  RiInstagramFill,
  RiMapPin2Fill,
  RiSearchLine,
  RiTrophyFill,
} from "react-icons/ri/index.js";
import { format } from "date-fns";

const today = format(new Date(), "dd-MM-yy");

export const MainNav = () => {
  const location = useLocation();

  return (
    <Flex
      gap={1}
      fontSize="lg"
      bgColor="gray.800"
      p={1}
      rounded="lg"
      w={{ base: "full", md: "auto" }}
    >
      <LinkButton
        to="/map/all"
        size="sm"
        fontSize="lg"
        variant={location.pathname.includes("/map") ? "primary" : "ghost"}
      >
        <RiMapPin2Fill />
      </LinkButton>
      <LinkButton
        to={`/calendar/week/${today}`}
        size="sm"
        fontSize="lg"
        variant={location.pathname.includes("/calendar") ? "primary" : "ghost"}
      >
        <RiCalendarFill />
      </LinkButton>
      <LinkButton
        to="/catalogue"
        size="sm"
        fontSize="lg"
        variant={location.pathname.includes("/catalogue") ? "primary" : "ghost"}
      >
        <RiSearchLine />
      </LinkButton>
      <LinkButton
        to="/2024/schedule"
        size="sm"
        fontSize="lg"
        variant={location.pathname.includes("/2024") ? "primary" : "ghost"}
      >
        <RiTrophyFill />
      </LinkButton>

      <Spacer />
      <Box w="1px" bgColor="gray.500" />

      <LinkButton
        size="sm"
        fontSize="lg"
        target="_blank"
        variant="ghost"
        to="https://www.facebook.com/RCDriftingUK/"
      >
        <RiFacebookFill />
      </LinkButton>

      <LinkButton
        size="sm"
        fontSize="lg"
        target="_blank"
        variant="ghost"
        to="https://www.instagram.com/rcdriftuk"
      >
        <RiInstagramFill />
      </LinkButton>
    </Flex>
  );
};
