import { Outlet, useLocation } from "react-router";
import { Box, Container, styled } from "~/styled-system/jsx";
import { TabsBar } from "~/components/TabsBar";
import { Tab } from "~/components/Tab";
import { RiListOrdered2, RiVipCrown2Line } from "react-icons/ri";

const Page = () => {
  const location = useLocation();
  const isTournaments = location.pathname.startsWith("/tournaments");

  return (
    <>
      <Box
        bgImage="linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.9)), url(https://ngo12if6yyhjvs7m.public.blob.vercel-storage.com/Group_Photo_8c37c991-c88d-43ba-9614-b8b874315868_1024x1024.webp)"
        bgSize="cover"
        bgPosition="center"
        pos="relative"
        borderBottomWidth={1}
        borderColor="gray.900"
      >
        <Container maxW={1100} px={4} pt={{ base: 12, md: 20 }} pb={16}>
          <styled.h1 srOnly>SDC 2026 - Super Drift Competition</styled.h1>
          <Box maxW={500} mx="auto" mb={6}>
            <styled.img
              w="full"
              src="https://ngo12if6yyhjvs7m.public.blob.vercel-storage.com/sdc-logo-sm.png"
              alt="SDC 2026"
            />
          </Box>
        </Container>
      </Box>

      <TabsBar maxW={800}>
        <Tab to="/" isActive={!isTournaments}>
          <RiListOrdered2 />
          Standings
        </Tab>
        <Tab to="/tournaments" isActive={isTournaments}>
          <RiVipCrown2Line />
          Tournaments
        </Tab>
      </TabsBar>

      <Outlet />
    </>
  );
};

export default Page;
