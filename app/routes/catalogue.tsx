import { Outlet } from "react-router";
import { Container } from "~/styled-system/jsx";

const Page = () => {
  return (
    <Container px={4} pb={8} maxW={1100}>
      <Outlet />
    </Container>
  );
};

export default Page;
