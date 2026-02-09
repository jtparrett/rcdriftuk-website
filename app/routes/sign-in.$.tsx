import { SignIn } from "@clerk/react-router";
import { Link } from "react-router";
import { css } from "~/styled-system/css";
import { Container, Flex, styled } from "~/styled-system/jsx";

export default function SignInPage() {
  return (
    <Container maxW={1100} px={2} py={12}>
      <SignIn />

      <styled.p textAlign="center" mt={4}>
        Don't have an account?{" "}
        <Link to="/sign-up" className={css({ color: "brand.500" })}>
          Sign up
        </Link>
      </styled.p>
    </Container>
  );
}
