import { BsCalendar } from "react-icons/bs/index.js";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { Box, Flex, styled } from "~/styled-system/jsx";

const Page = () => {
  return (
    <>
      <Breadcrumbs
        paths={[
          {
            to: "/2024/schedule",
            title: "Schedule",
          },
          {
            to: "/2024/schedule/mar",
            title: "Round 1",
          },
        ]}
      />

      <Flex flexDir="column" gap={4} maxW={800} pb={8}>
        <Box overflow="hidden" rounded="xl">
          <styled.img src="/round-1-cover.jpg" />
        </Box>

        <Box>
          <Flex alignItems="start" gap={2}>
            <styled.span color="gray.400" mt={1}>
              <BsCalendar />
            </styled.span>
            <styled.p>March 2nd, 2024 · 10am - 11pm</styled.p>
          </Flex>
        </Box>

        <styled.p>More information will be available soon.</styled.p>
      </Flex>
    </>
  );
};

export default Page;
