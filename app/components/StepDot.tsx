import { Box, Center } from "~/styled-system/jsx";

export const StepDot = () => {
  return (
    <Center
      rounded="full"
      w={4}
      h={4}
      bgColor="brand.500"
      fontSize="md"
      pos="relative"
      flex="none"
      mt={1}
      _after={{
        content: '""',
        w: 2,
        h: 2,
        bgColor: "gray.950",
        rounded: "full",
      }}
    >
      <Box
        pos="absolute"
        bottom="50%"
        w="2px"
        bgColor="brand.500"
        left="50%"
        ml="-1px"
        h="500vh"
        zIndex={-1}
      />
    </Center>
  );
};
