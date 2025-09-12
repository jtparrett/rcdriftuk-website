import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { LinkButton } from "./Button";
import { AppName } from "~/utils/enums";

export const Footer = () => {
  return (
    <Box borderTopWidth={1} borderColor="gray.900" py={8}>
      <Container maxW={1100} px={4}>
        <Flex
          alignItems="center"
          mb={{ base: 4, md: 0 }}
          flexDirection={{ base: "column", md: "row" }}
        >
          <Box>
            <styled.img
              src="/rcdriftio-light.svg"
              w={120}
              mb={2}
              alt={AppName}
            />
          </Box>

          <Spacer />

          <Flex justifyContent="center">
            <LinkButton
              variant="ghost"
              size="xs"
              target="_blank"
              to="https://rcdrift.io/privacy-policy.html"
            >
              Privacy Policy
            </LinkButton>
            <LinkButton variant="ghost" size="xs" to="/privacy-cookie-policy">
              Cookie Policy
            </LinkButton>
          </Flex>
        </Flex>

        <styled.p
          fontSize="sm"
          color="gray.600"
          textAlign={{ base: "center", md: "left" }}
        >
          &copy; {new Date().getFullYear()} RC Drift LTD. All Rights Reserved.
        </styled.p>
      </Container>
    </Box>
  );
};
