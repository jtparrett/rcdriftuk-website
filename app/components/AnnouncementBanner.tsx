import { Link } from "@remix-run/react";
import { RiArrowRightLine } from "react-icons/ri";
import { styled, Box, Container, Flex } from "~/styled-system/jsx";

export const AnnouncementBanner = () => {
  return (
    <Box bgColor="brand.500" color="white">
      <Container maxW={1100} px={2} textAlign="center">
        <Link to="/2025">
          <Flex justifyContent="center" gap={2} alignItems="center" py={1}>
            <styled.p fontWeight="semibold">
              Learn more about RC Drift.uk 2025
            </styled.p>
            <RiArrowRightLine size={16} />
          </Flex>
        </Link>
      </Container>
    </Box>
  );
};
