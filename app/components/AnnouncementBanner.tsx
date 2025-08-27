import { Link } from "react-router";
import { RiArrowRightLine } from "react-icons/ri";
import { styled, Box, Container, Flex } from "~/styled-system/jsx";

export const AnnouncementBanner = () => {
  return (
    <Box bgColor="brand.500" color="white" pos="relative" zIndex={16}>
      <Container maxW={1100} px={2} textAlign="center">
        <Link to="/2025">
          <Flex justifyContent="center" gap={2} alignItems="center" py={1}>
            <styled.p fontWeight="semibold" fontSize="sm">
              Learn more about the 2025 Season
            </styled.p>
            <RiArrowRightLine size={16} />
          </Flex>
        </Link>
      </Container>
    </Box>
  );
};
