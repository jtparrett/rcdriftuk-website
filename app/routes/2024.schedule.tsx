import { Outlet } from "@remix-run/react";
import { Container } from "~/styled-system/jsx";

const Page = () => {
  return (
    <Container pb={4}>
      <Outlet />
    </Container>
  );
};

export default Page;
