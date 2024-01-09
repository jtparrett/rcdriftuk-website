import { BsCalendar } from "react-icons/bs/index.js";
import { LinkButton } from "~/components/Button";
import { styled, Box, Container, Center } from "~/styled-system/jsx";

const Page = () => {
  return (
    <Container py={4} px={2}>
      <Box pt="52.5%" pos="relative" rounded="xl" bgColor="gray.700">
        <Center pos="absolute" inset={0}>
          <Box textAlign="center">
            <styled.p fontSize="lg" fontWeight="bold" mb={5}>
              We're not live right now.
            </styled.p>
            <LinkButton to="/2024/schedule">
              Check The Schedule <BsCalendar />
            </LinkButton>
          </Box>
        </Center>
      </Box>
    </Container>
  );
};

export default Page;
