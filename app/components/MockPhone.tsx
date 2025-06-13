import { Box, styled } from "~/styled-system/jsx";

export const MockPhone = ({ src }: { src: string }) => {
  return (
    <Box
      overflow="hidden"
      roundedTop="36px"
      borderWidth={6}
      borderBottomWidth={0}
      borderColor="gray.800"
      shadow="1px -1px 0 rgba(255, 255, 255, 0.3), 0 4px 24px rgba(0, 0, 0, 0.5)"
      w={{ base: "full", md: "36%" }}
      flex="none"
      mt={{ base: 0, md: 12 }}
      alignSelf={{ base: "flex-start", md: "flex-end" }}
      maxW="300px"
      mx="auto"
    >
      <Box
        roundedTop="4xl"
        overflow="hidden"
        borderWidth={2}
        borderBottomWidth={0}
        borderColor="black"
        pos="relative"
        _after={{
          content: '""',
          pt: "120%",
          display: "block",
        }}
      >
        <styled.img
          src="/glare.svg"
          w="full"
          pos="absolute"
          top={0}
          left={0}
          zIndex={1}
        />
        <styled.img src={src} w="full" pos="absolute" top={0} left={0} />
      </Box>
    </Box>
  );
};
