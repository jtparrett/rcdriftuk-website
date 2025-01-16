import { Box, Flex, styled } from "~/styled-system/jsx";
import { LinkButton } from "./Button";

export const Footer = () => {
  return (
    <Box
      borderTopWidth={1}
      borderColor="gray.800"
      py={8}
      textAlign="center"
      mt={4}
    >
      <styled.p fontSize="sm" color="gray.600" mb={2} display="block">
        &copy;RCDrift.uk {new Date().getFullYear()}
      </styled.p>
      <Flex gap={2} justifyContent="center">
        <LinkButton
          variant="secondary"
          size="xs"
          target="_blank"
          to="https://rcdrift.uk/privacy-policy.html"
        >
          Privacy Policy
        </LinkButton>
        <LinkButton variant="secondary" size="xs" to="/privacy-cookie-policy">
          Cookie Policy
        </LinkButton>
      </Flex>
    </Box>
  );
};
