import { RiTicketFill } from "react-icons/ri";
import { Button, LinkButton } from "./Button";
import { TicketStatus } from "~/utils/enums";
import type { GetEvent } from "~/utils/getEvent.server";
import { SignedIn, SignedOut, useClerk } from "@clerk/react-router";
import { isBefore, intervalToDuration } from "date-fns";
import { styled, Flex, Box } from "~/styled-system/jsx";
import type { GetUserEventTicket } from "~/utils/getUserEventTicket.server";
import { useState, useEffect } from "react";
import { ClientOnly } from "./ClientOnly";
import { useRevalidator } from "react-router";
import { toZonedTime } from "date-fns-tz";

interface Props {
  event: GetEvent;
  ticket: GetUserEventTicket;
  isSoldOut: boolean;
  userRank?: string | null;
}

const CountdownDisplay = ({ releaseDate }: { releaseDate: Date }) => {
  const revalidator = useRevalidator();

  const [timeUntilRelease, setTimeUntilRelease] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const duration = intervalToDuration({
        start: toZonedTime(new Date(), "Europe/London"),
        end: releaseDate,
      });

      const totalDays = (duration.months ?? 0) * 30 + (duration.days ?? 0);

      const newTimeUntilRelease = {
        days: totalDays,
        hours: duration.hours ?? 0,
        minutes: duration.minutes ?? 0,
        seconds: duration.seconds ?? 0,
      };

      setTimeUntilRelease(newTimeUntilRelease);

      if (
        newTimeUntilRelease.days <= 0 &&
        newTimeUntilRelease.hours <= 0 &&
        newTimeUntilRelease.minutes <= 0 &&
        newTimeUntilRelease.seconds <= 0
      ) {
        revalidator.revalidate();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [releaseDate, revalidator]);

  return (
    <styled.div
      textAlign="center"
      color="brand.500"
      fontFamily="mono"
      fontWeight="semibold"
      mt={2}
      fontSize="sm"
    >
      Tickets release in{" "}
      <styled.span fontSize="md">
        {timeUntilRelease.days}d {timeUntilRelease.hours}hr{" "}
        {timeUntilRelease.minutes}min {timeUntilRelease.seconds}s
      </styled.span>
    </styled.div>
  );
};

const AllowedRanksBadges = ({
  allowedRanks,
}: {
  allowedRanks: string[];
}) => {
  return (
    <Box mb={2}>
      <styled.p
        fontSize="xs"
        color="gray.400"
        fontWeight="semibold"
        mb={1}
        textTransform="uppercase"
        letterSpacing="wider"
      >
        Available for
      </styled.p>
      <Flex gap={1.5} flexWrap="wrap">
        {allowedRanks.map((rank) => (
          <Flex
            key={rank}
            alignItems="center"
            gap={1}
            px={2}
            py={0.5}
            rounded="lg"
            bgColor="gray.800"
            borderWidth={1}
            borderColor="gray.700"
          >
            <styled.img
              src={`/badges/${rank}.png`}
              alt={rank}
              w={3.5}
              h={3.5}
            />
            <styled.span fontSize="xs" fontWeight="semibold">
              {rank.charAt(0).toUpperCase() + rank.slice(1)}
            </styled.span>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

const TicketTypeCard = ({
  event,
  ticketType,
  userRank,
}: {
  event: NonNullable<GetEvent>;
  ticketType: NonNullable<GetEvent>["ticketTypes"][number];
  userRank?: string | null;
}) => {
  const clerk = useClerk();

  const releaseDate = toZonedTime(new Date(ticketType.releaseDate), "UTC");
  const isBeforeRelease = isBefore(
    toZonedTime(new Date(), "Europe/London"),
    releaseDate,
  );

  const allowedRanks = ticketType.allowedRanks ?? [];
  const hasRankRestriction = allowedRanks.length > 0;
  const userRankAllowed =
    !hasRankRestriction ||
    (userRank != null && allowedRanks.includes(userRank));

  const formattedPrice = `£${ticketType.price.toFixed(2)}`;

  return (
    <Box borderWidth={1} borderColor="gray.800" rounded="xl" p={4}>
      <Flex justifyContent="space-between" alignItems="center" mb={2}>
        <styled.span fontWeight="semibold">{ticketType.name}</styled.span>
        <styled.span fontWeight="bold" color="brand.500">
          {formattedPrice}
        </styled.span>
      </Flex>

      {hasRankRestriction ? (
        <AllowedRanksBadges allowedRanks={allowedRanks} />
      ) : (
        <styled.p
          fontSize="xs"
          color="gray.500"
          mb={2}
        >
          Open to all ranks
        </styled.p>
      )}

      {isBeforeRelease ? (
        <>
          <Button disabled w="full" variant="secondary">
            Buy Ticket - {formattedPrice} <RiTicketFill />
          </Button>
          <ClientOnly>
            <CountdownDisplay releaseDate={releaseDate} />
          </ClientOnly>
        </>
      ) : hasRankRestriction && !userRankAllowed ? (
        <>
          <SignedIn>
            <Button disabled w="full" variant="secondary">
              Not available for your rank <RiTicketFill />
            </Button>
          </SignedIn>
          <SignedOut>
            <Button
              onClick={() =>
                clerk.openSignIn({
                  redirectUrl: `/events/${event.id}`,
                })
              }
              w="full"
            >
              Sign in to check eligibility <RiTicketFill />
            </Button>
          </SignedOut>
        </>
      ) : (
        <>
          <SignedIn>
            <LinkButton
              to={`/events/${event.id}/ticket?ticketTypeId=${ticketType.id}`}
              w="full"
            >
              Buy Ticket - {formattedPrice} <RiTicketFill />
            </LinkButton>
          </SignedIn>
          <SignedOut>
            <Button
              onClick={() =>
                clerk.openSignIn({
                  redirectUrl: `/events/${event.id}/ticket?ticketTypeId=${ticketType.id}`,
                })
              }
              w="full"
            >
              Buy Ticket - {formattedPrice} <RiTicketFill />
            </Button>
          </SignedOut>
        </>
      )}
    </Box>
  );
};

export const EventTicketSection = ({
  event,
  ticket,
  isSoldOut,
  userRank,
}: Props) => {
  if (!event || event.ticketTypes.length === 0) {
    return null;
  }

  if (
    ticket &&
    (ticket.status === TicketStatus.CONFIRMED ||
      ticket.status === TicketStatus.PENDING)
  ) {
    return (
      <Box>
        <LinkButton to={`/events/${event.id}/ticket`} w="full">
          {ticket.status === TicketStatus.CONFIRMED
            ? "View Ticket"
            : "Continue With Ticket"}
          <RiTicketFill />
        </LinkButton>
      </Box>
    );
  }

  if (isSoldOut) {
    return (
      <Box>
        <Button disabled w="full">
          Sold out <RiTicketFill />
        </Button>
      </Box>
    );
  }

  return (
    <Flex flexDir="column" gap={3}>
      {event.ticketTypes.map((ticketType) => (
        <TicketTypeCard
          key={ticketType.id}
          event={event}
          ticketType={ticketType}
          userRank={userRank}
        />
      ))}
    </Flex>
  );
};
