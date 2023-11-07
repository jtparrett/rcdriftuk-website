import { BsArrowRight } from "react-icons/bs/index.js";
import { LinkButton } from "~/components/Button";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { NEXT_EVENT } from "~/utils/consts/nextEvent";

const Page = () => {
  return (
    <Box
      bgGradient="to-b"
      gradientFrom="brand-700"
      gradientVia="transparent"
      gradientTo="transparent"
    >
      <Container maxW={400} py={24}>
        <Flex flexDir="column" gap={4}>
          <styled.img w="80%" src="/rcdriftuk.svg" mx="auto" mb={8} />

          <LinkButton
            to={`/2024/schedule/${NEXT_EVENT}`}
            variant="primary"
            fontSize="lg"
          >
            🏆 2024 Championship 🏆
          </LinkButton>
          <LinkButton to="/map/all" variant="outline" fontSize="lg">
            Find Your Local Track <BsArrowRight />
          </LinkButton>
        </Flex>
      </Container>
    </Box>
  );
};

export default Page;
