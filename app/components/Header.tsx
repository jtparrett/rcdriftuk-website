import { styled, Flex, Spacer } from "~/styled-system/jsx";
import { Link } from "@remix-run/react";
import { MainNav } from "./MainNav";

export const Header = () => {
  return (
    <Flex
      gap={2}
      alignItems="center"
      py={4}
      flexDir={{ base: "column", md: "row" }}
    >
      <Link to="/">
        <styled.img w={180} src="/rcdriftuk.svg" />
      </Link>

      <Spacer />

      <MainNav />
    </Flex>
  );
};
