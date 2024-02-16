import { styled, Box, Container } from "~/styled-system/jsx";

const Page = () => {
  return (
    <Container py={4} px={2} maxW={1100}>
      <Box
        pt="52.5%"
        pos="relative"
        rounded="xl"
        bgColor="gray.800"
        overflow="hidden"
      >
        <styled.iframe
          src="https://www.youtube.com/embed/live_stream?channel=UCzxW07KOXZc9huwyDId7prw"
          pos="absolute"
          w="full"
          h="full"
          inset={0}
        />
      </Box>
    </Container>
  );
};

export default Page;
