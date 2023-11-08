import {
  BsCalendar,
  BsFacebook,
  BsTicketPerforatedFill,
} from "react-icons/bs/index.js";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { LinkButton } from "~/components/Button";
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

        <styled.h1
          fontSize={{ base: "3xl", md: "4xl" }}
          lineHeight={1.1}
          fontWeight="bold"
        >
          RC DRIFT UK 2024 Championship launch 🔥
        </styled.h1>

        <styled.p>
          We are delighted to be launching the RC DRIFT UK championship 2024 at
          the largest car show in Europe, the Autosport International show at
          the NEC!
        </styled.p>

        <styled.p>
          We will be putting on a display of RC drifting for the 80,000+ people
          who will be attending the show over the 4 days.
        </styled.p>

        <styled.p>
          We know how popular the track is having witnessed Slide House at the
          show in 2020. You can expect crowds, huge crowds watching what we do
          and asking about our hobby, the perfect place to launch the
          championship. The track will be a hard surface and designed to
          showcase RC drifting at its best.
        </styled.p>

        <styled.p>We will supply tables and power for every driver.</styled.p>

        <styled.p>
          Drivers from across the UK will be there with every type of car you
          can think of.
        </styled.p>

        <styled.p>
          There will be 4 ticket options for drivers and additional people, like
          fathers and partners:
        </styled.p>

        <ul>
          <li>4 x days</li>
          <li>3 x days</li>
          <li>2 x days</li>
          <li>1 x day - Saturday</li>
          <li>1 x day - Sunday</li>
        </ul>

        <styled.p>
          These will be released in stages, people who are attending for the 4
          days will be given the chance to buy tickets first, then 3 days, 2
          days, Saturday and then Sunday.
        </styled.p>

        <styled.p>
          If tickets sell out before the single day tickets are due to be
          released, we will of course let you know in advance.
        </styled.p>

        <styled.p>
          *Please note these ticket are not for the general public*
        </styled.p>

        <styled.p>
          ALL names will be checked and verified, if you are not an RC drifter
          or partner, your ticket will NOT be refunded and the ticket will not
          be valid for the event!
        </styled.p>
        <styled.p>
          All tickets are non refundable under any circumstances!
        </styled.p>
        <styled.p>NB* This event is not suitable for beginners!</styled.p>

        <Flex gap={4} flexDir={{ base: "column", md: "row" }}>
          <LinkButton
            to="https://www.tickettailor.com/checkout/new-session/id/3266078/chk/deb7/"
            target="_blank"
            fontSize="md"
            px={8}
          >
            Buy Tickets <BsTicketPerforatedFill />
          </LinkButton>

          <LinkButton
            to="https://www.facebook.com/events/2649108381945026/"
            target="_blank"
            variant="ghost"
          >
            Open Facebook Event <BsFacebook />
          </LinkButton>
        </Flex>
      </Flex>
    </styled.main>
  );
};

export default Page;
