import { Outlet } from "@remix-run/react";
import { Header } from "~/components/Header";
import { Container } from "~/styled-system/jsx";

const Page = () => {
  return (
    <>
      <Header />
      <Container px={2} pb={8}>
        <Outlet />
      </Container>
    </>
  );
};

export default Page;
