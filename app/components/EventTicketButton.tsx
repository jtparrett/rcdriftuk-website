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

      // Convert months to days (approximate)
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
    >
      Tickets release in{" "}
      <styled.span fontSize="lg">
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
    <Box mb={3}>
      <styled.p
        fontSize="xs"
        color="gray.400"
        fontWeight="semibold"
        mb={1.5}
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
            py={1}
            rounded="lg"
            bgColor="gray.800"
            borderWidth={1}
            borderColor="gray.700"
          >
            <styled.img
              src={`/badges/${rank}.png`}
              alt={rank}
              w={4}
              h={4}
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

export const EventTicketButton = ({
  event,
  ticket,
  isSoldOut,
  userRank,
}: Props) => {
  const clerk = useClerk();

  // We write this as london time in the db, but it's stored as UTC
  const releaseDate = event?.ticketReleaseDate
    ? toZonedTime(new Date(event.ticketReleaseDate), "UTC")
    : null;

  const isBeforeRelease = releaseDate
    ? isBefore(toZonedTime(new Date(), "Europe/London"), releaseDate)
    : false;

  if (!event || !event.enableTicketing) {
    return null;
  }

  const allowedRanks = event.allowedRanks ?? [];
  const hasRankRestriction = allowedRanks.length > 0;
  const userRankAllowed =
    !hasRankRestriction || (userRank != null && allowedRanks.includes(userRank));

  const formattedPrice = event.ticketPrice
    ? `£${event.ticketPrice.toFixed(2)}`
    : null;

  if (releaseDate && isBeforeRelease) {
    return (
      <>
        {hasRankRestriction && (
          <AllowedRanksBadges allowedRanks={allowedRanks} />
        )}
        <Button disabled w="full" variant="secondary">
          Buy Ticket {formattedPrice && `- ${formattedPrice}`} <RiTicketFill />
        </Button>
        {releaseDate && (
          <ClientOnly>
            <CountdownDisplay releaseDate={releaseDate} />
          </ClientOnly>
        )}
      </>
    );
  }

  if (
    ticket &&
    (ticket.status === TicketStatus.CONFIRMED ||
      ticket.status === TicketStatus.PENDING)
  ) {
    return (
      <>
        {hasRankRestriction && (
          <AllowedRanksBadges allowedRanks={allowedRanks} />
        )}
        <LinkButton to={`/events/${event.id}/ticket`} w="full">
          {ticket.status === TicketStatus.CONFIRMED
            ? "View Ticket"
            : "Continue With Ticket"}
          <RiTicketFill />
        </LinkButton>
      </>
    );
  }

  if (isSoldOut) {
    return (
      <>
        {hasRankRestriction && (
          <AllowedRanksBadges allowedRanks={allowedRanks} />
        )}
        <Button disabled w="full">
          Sold out <RiTicketFill />
        </Button>
      </>
    );
  }

  if (hasRankRestriction && !userRankAllowed) {
    return (
      <>
        <AllowedRanksBadges allowedRanks={allowedRanks} />
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
    );
  }

  return (
    <>
      {hasRankRestriction && (
        <AllowedRanksBadges allowedRanks={allowedRanks} />
      )}
      <SignedIn>
        <LinkButton to={`/events/${event.id}/ticket`} w="full">
          Buy Ticket {formattedPrice && `- ${formattedPrice}`} <RiTicketFill />
        </LinkButton>
      </SignedIn>

      <SignedOut>
        <Button
          onClick={() =>
            clerk.openSignIn({
              redirectUrl: `/events/${event.id}/ticket`,
            })
          }
          w="full"
        >
          Buy Ticket {formattedPrice && `- ${formattedPrice}`} <RiTicketFill />
        </Button>
      </SignedOut>
    </>
  );
};
