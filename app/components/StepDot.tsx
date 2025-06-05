import { Box, Center } from "~/styled-system/jsx";

export const StepDot = () => {
  return (
    <Center
      rounded="full"
      w={6}
      h={6}
      bgColor="brand.500"
      fontSize="md"
      pos="relative"
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
