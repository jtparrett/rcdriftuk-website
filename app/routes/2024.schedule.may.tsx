import { BsCalendar } from "react-icons/bs/index.js";
import { Box, Flex, styled } from "~/styled-system/jsx";

const Page = () => {
  return (
    <Flex flexDir="column" gap={4} maxW={800} pt={4}>
      <Box>
        <Flex alignItems="start" gap={2}>
          <styled.span color="gray.400" mt={1}>
            <BsCalendar />
          </styled.span>
          <styled.p>May 4th, 2024 · 10am - 11pm</styled.p>
        </Flex>
      </Box>

      <Box overflow="hidden" rounded="xl">
        <styled.img src="/round-3-cover.jpg" />
      </Box>

      <styled.p>More information will be available soon...</styled.p>
    </Flex>
  );
};

export default Page;
