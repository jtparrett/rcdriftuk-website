import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { Button, LinkButton } from "./Button";
import { Form } from "react-router";

export const CookieBanner = () => {
  return (
    <Box
      bgColor="gray.900"
      pos="fixed"
      bottom={0}
      left={0}
      w="100%"
      zIndex={11}
    >
      <Container px={2} maxW={1100} py={4}>
        <Flex
          alignItems={{ md: "center" }}
          flexDir={{ base: "column", md: "row" }}
          gap={2}
        >
          <styled.p fontSize="sm" flex={1}>
            We use cookies to improve your experience on our website.
            <br /> By browsing this website, you agree to our use of cookies.
          </styled.p>

          <Flex gap={2}>
            <LinkButton
              flexGrow={{ base: 1, md: "none" }}
              variant="secondary"
              size="xs"
              target="_blank"
              to="https://rcdrift.uk/privacy-policy.html"
            >
              Privacy Policy
            </LinkButton>

            <LinkButton
              flexGrow={{ base: 1, md: "none" }}
              whiteSpace="nowrap"
              size="xs"
              variant="secondary"
              to="/privacy-cookie-policy"
            >
              More Info
            </LinkButton>

            <Box flexGrow={{ base: 1, md: "none" }}>
              <Form method="post" action="/api/hide-banner">
                <Button size="xs" type="submit" w="full">
                  Accept
                </Button>
              </Form>
            </Box>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
};
