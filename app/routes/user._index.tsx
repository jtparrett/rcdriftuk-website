import { Outlet } from "react-router";
import { Container } from "~/styled-system/jsx";

const UserPage = () => {
  return (
    <Container maxW={1100} px={2}>
      <Outlet />
    </Container>
  );
};

export default UserPage;
