import { Link } from "@remix-run/react";
import {
  BsCalendar,
  BsFacebook,
  BsInstagram,
  BsMap,
  BsTrophy,
} from "react-icons/bs/index.js";
import { styled, Flex, Box } from "~/styled-system/jsx";

export const MainNav = () => {
  return (
    <Flex gap={4} fontSize="lg" px={4}>
      <Link to="/map/all">
        <BsMap />
      </Link>
      <Link to="/calendar">
        <BsCalendar />
      </Link>
      <Link to="/2024/schedule">
        <BsTrophy />
      </Link>

      <Box w="1px" bgColor="white" />

      <styled.a target="_blank" href="https://www.facebook.com/RCDriftingUK/">
        <BsFacebook />
      </styled.a>

      <styled.a target="_blank" href="https://www.instagram.com/rcdriftuk">
        <BsInstagram />
      </styled.a>
    </Flex>
  );
};
