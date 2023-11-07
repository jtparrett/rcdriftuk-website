import { BsCalendar, BsChevronRight, BsHouse } from "react-icons/bs/index.js";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { Button, LinkButton } from "~/components/Button";
import { Box, Flex, styled } from "~/styled-system/jsx";

const Page = () => {
  return (
    <styled.main>
      <Breadcrumbs
        paths={[
          {
            to: "/2024/schedule",
            title: "Schedule",
          },
          {
            to: "/2024/schedule/jan",
            title: "Launch",
          },
        ]}
      />

      <Box overflow="hidden" rounded="xl">
        <styled.img src="/launch-event-cover.jpg" />
      </Box>
      <Flex flexDir="column" gap={4} maxW={800} pt={4}>
        <Box>
          <Flex alignItems="start" gap={2}>
            <styled.span color="gray.400" mt={1}>
              <BsCalendar />
            </styled.span>
            <styled.p>
              January 11, 2024 · 9am - January 14, 2024 · 5pm GMT
            </styled.p>
          </Flex>
        </Box>

        <styled.h1 fontSize="4xl" fontWeight="bold">
          RC Drift UK at the Autosport show
        </styled.h1>

        <styled.p>
          The national championship for RC drifting in the UK is proud to
          announce we will be attending the Autosport Show International 2024.
        </styled.p>
        <styled.p>
          We invite you to join us for the show and drive your RC car with
          others in front of 80,000 people over 4 days.
        </styled.p>
        <styled.p>
          These tickets will be sold on a first come first serve basis, we will
          create a reserve list if places for the event sell out. Tickets You
          will find 8 options available, 4 x are for driver tickets, 4 x are
          available for addtional people, This might be your Dad or partner.
          Tickets to attend the show retail at £40 per day. We are offering you
          a HUGE saving by offering you;
        </styled.p>
        <styled.ul>
          <styled.li>4 x day ticket for just £75!</styled.li>
          <styled.li>3 x day ticket £60</styled.li>
          <styled.li>2 x day ticket £50</styled.li>
          <styled.li>1 x day ticket £25</styled.li>
        </styled.ul>
        <styled.p>The longer you stay, the cheaper it gets.</styled.p>
        <styled.p>Release dates.</styled.p>
        <styled.p>
          They will all be released in the same order as above on each Sunday at
          8pm GMT starting on November 12th.
        </styled.p>
        <styled.p>
          There will be further details emailed to you to avoid any confusion.
        </styled.p>

        <Box>
          <Button fontSize="md">Buy Tickets (Coming Soon)</Button>
        </Box>
      </Flex>
    </styled.main>
  );
};

export default Page;
