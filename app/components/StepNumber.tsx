import { HiCheck } from "react-icons/hi";
import { Box, Center } from "~/styled-system/jsx";

interface Props {
  value: string | number;
  isComplete?: boolean;
}

export const StepNumber = ({ value, isComplete = false }: Props) => {
  return (
    <Center
      rounded="full"
      w={10}
      h={10}
      borderWidth={1}
      borderColor="brand.500"
      fontWeight="bold"
      boxShadow="0 0 0 4px rgba(12, 12, 12, 0.03)"
      color="white"
      bgColor="brand.500"
      fontSize="md"
      pos="relative"
    >
      <Box
        pos="absolute"
        bottom="50%"
        w={1}
        bgColor="brand.500"
        left="50%"
        ml={-0.5}
        h="100vh"
        zIndex={-1}
      />
      {isComplete ? <HiCheck /> : value}
    </Center>
  );
};
