import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { Button, LinkButton } from "./Button";
import { Form } from "@remix-run/react";

export const CookieBanner = () => {
  return (
    <Box bgColor="gray.900">
      <Container px={2} maxW={1100} py={2}>
        <Flex
          alignItems="center"
          flexDir={{ base: "column", md: "row" }}
          gap={2}
        >
          <styled.p fontSize="sm" flex={1}>
            We use cookies to improve your experience on our website. By
            browsing this website, you agree to our use of cookies.
          </styled.p>

          <Flex gap={2}>
            <LinkButton
              variant="secondary"
              size="xs"
              target="_blank"
              to="https://rcdrift.uk/privacy-policy.html"
            >
              Privacy Policy
            </LinkButton>

            <LinkButton
              whiteSpace="nowrap"
              size="xs"
              variant="secondary"
              to="/privacy-cookie-policy"
            >
              More Info
            </LinkButton>
            <Form method="post" action="/api/hide-banner">
              <Button size="xs" type="submit">
                Accept
              </Button>
            </Form>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
};
