import { SignIn } from "@clerk/react-router";
import { Container } from "~/styled-system/jsx";

export default function SignInPage() {
  return (
    <Container maxW={1100} px={2} py={12}>
      <SignIn forceRedirectUrl="/feed" />
    </Container>
  );
}
