import {
  RiArrowDropDownLine,
  RiArrowDropLeftLine,
  RiArrowDropRightLine,
  RiArrowDropUpLine,
  RiArrowLeftLine,
} from "react-icons/ri";
import { Button } from "~/components/Button";
import { Box, Center, Flex, Spacer, styled } from "~/styled-system/jsx";

const VTrackPage = () => {
  return (
    <Flex h="calc(100dvh - 100px)" flexDir="column">
      <Box w="1024px" maxW="100%" mx="auto">
        <styled.canvas id="canvas" w="100%" />
      </Box>
      <Center flex={1} gap={1} px={16}>
        <Button id="car-left" p={0} w={16} h={16} fontSize="3xl">
          <RiArrowDropLeftLine />
        </Button>
        <Button id="car-right" p={0} w={16} h={16} fontSize="3xl">
          <RiArrowDropRightLine />
        </Button>

        <Spacer />

        <Button id="car-go" p={0} w={16} h={16} fontSize="3xl">
          <RiArrowDropUpLine />
        </Button>
        <Button id="car-stop" p={0} w={16} h={16} fontSize="3xl">
          <RiArrowDropDownLine />
        </Button>
      </Center>
      <script src="/vtrack.js" async />
    </Flex>
  );
};

export default VTrackPage;
