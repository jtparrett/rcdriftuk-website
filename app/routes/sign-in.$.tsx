import { SignIn } from "@clerk/remix";
import { Container } from "~/styled-system/jsx";

export default function SignInPage() {
  return (
    <Container maxW={1100} px={2} py={12}>
      <SignIn />
    </Container>
  );
}
