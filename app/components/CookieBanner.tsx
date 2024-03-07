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
          <styled.p fontSize="sm">
            We use cookies to improve your experience on our website. By
            browsing this website, you agree to our use of cookies.
          </styled.p>

          <Spacer />

          <Flex gap={2}>
            <LinkButton
              whiteSpace="nowrap"
              size="sm"
              variant="secondary"
              to="/privacy-cookie-policy"
            >
              More Info
            </LinkButton>
            <Form method="post" action="/api/hide-banner">
              <Button size="sm" type="submit">
                Accept
              </Button>
            </Form>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
};
