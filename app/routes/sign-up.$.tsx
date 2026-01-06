import { SignUp } from "@clerk/react-router";
import { Container } from "~/styled-system/jsx";

export default function SignUpPage() {
  return (
    <Container maxW={1100} px={2} py={12}>
      <SignUp />
    </Container>
  );
}
