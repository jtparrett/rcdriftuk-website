import { RiCheckboxCircleLine } from "react-icons/ri/index.js";
import { LinkButton } from "~/components/Button";
import { styled, Box, Center } from "~/styled-system/jsx";

const CalendarSuccessPage = () => {
  return (
    <Box maxW={400} mx="auto">
      <Box textAlign="center" py={12}>
        <Center fontSize="4xl" color="green.400" mb={4}>
          <RiCheckboxCircleLine />
        </Center>
        <styled.h1 fontSize="3xl" fontWeight="bold">
          Event Submitted
        </styled.h1>
        <styled.p mb={8}>
          Thank you for your submission. Admins will review your event and share
          on the calendar if appropriate.
        </styled.p>
        <LinkButton to="/">Go Home</LinkButton>
      </Box>
    </Box>
  );
};

export default CalendarSuccessPage;
