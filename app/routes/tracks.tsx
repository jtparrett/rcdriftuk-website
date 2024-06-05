import { Outlet } from "@remix-run/react";
import { Container } from "~/styled-system/jsx";

const Page = () => {
  return (
    <Container px={2} pb={8} maxW={1100}>
      <Outlet />
    </Container>
  );
};

export default Page;
