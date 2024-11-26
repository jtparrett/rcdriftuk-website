import { RiArrowRightLine } from "react-icons/ri";
import { LinkOverlay } from "~/components/LinkOverlay";
import {
  styled,
  Container,
  Flex,
  Box,
  Spacer,
  AspectRatio,
} from "~/styled-system/jsx";

const Page = () => {
  return (
    <Container maxW={1100} px={2} py={4} overflow="hidden">
      <styled.h1 fontWeight="black" fontSize="4xl" mb={2}>
        Championships
      </styled.h1>
      <Box h={1} bgColor="brand.500" w={32} mb={6} />
      <Flex flexWrap="wrap" mr={-4}>
        {["2025", "2024"].map((year) => (
          <Box w={{ base: "full", md: "50%" }} pr={4} pb={4} key={year}>
            <styled.article
              pos="relative"
              bgColor="gray.900"
              rounded="lg"
              overflow="hidden"
            >
              <LinkOverlay to={`/${year}`} />
              <AspectRatio ratio={16 / 9}>
                <styled.img src={`/${year}-cover.jpg`} w="full" alt={year} />
              </AspectRatio>
              <Box p={4}>
                <Flex alignItems="center">
                  <styled.h2 fontWeight="bold" fontSize="xl">
                    {year}
                  </styled.h2>
                  <Spacer />
                  <styled.span fontSize="xl">
                    <RiArrowRightLine />
                  </styled.span>
                </Flex>
              </Box>
            </styled.article>
          </Box>
        ))}
      </Flex>
    </Container>
  );
};

export default Page;
