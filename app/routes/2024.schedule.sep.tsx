import { Box, styled } from "~/styled-system/jsx";

const Page = () => {
  return (
    <Box textAlign="center" py={8}>
      <styled.h1
        fontSize="4xl"
        fontWeight="bold"
        textTransform="uppercase"
        textStyle="italic"
      >
        🏆 The Final 🏆
      </styled.h1>
      <styled.p fontSize="3lx">...TBC...</styled.p>
    </Box>
  );
};

export default Page;
