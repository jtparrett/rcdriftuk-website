import { SignUp } from "@clerk/react-router";
import { Link } from "react-router";
import { css } from "~/styled-system/css";
import { Container, styled } from "~/styled-system/jsx";

export default function SignUpPage() {
  return (
    <Container maxW={1100} px={2} py={12}>
      <SignUp />
      <styled.p textAlign="center" mt={4}>
        Already have an account?{" "}
        <Link to="/sign-in" className={css({ color: "brand.500" })}>
          Sign in
        </Link>
      </styled.p>
    </Container>
  );
}
