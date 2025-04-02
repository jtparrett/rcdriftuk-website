import { RiTicketFill } from "react-icons/ri";
import { Button, LinkButton } from "./Button";
import { TicketStatus } from "@prisma/client";
import type { GetEvent } from "~/utils/getEvent.server";
import { SignedIn, SignedOut, useClerk } from "@clerk/remix";
import { isBefore, intervalToDuration } from "date-fns";
import { styled } from "~/styled-system/jsx";
import type { GetUserEventTicket } from "~/utils/getUserEventTicket.server";
import { useState, useEffect } from "react";
import { ClientOnly } from "./ClientOnly";
import { useRevalidator } from "@remix-run/react";
import { toZonedTime } from "date-fns-tz";

interface Props {
  event: GetEvent;
  ticket: GetUserEventTicket;
  isSoldOut: boolean;
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
        start: toZonedTime(new Date(), "UTC"),
        end: toZonedTime(releaseDate, "UTC"),
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

      // Check if countdown has reached 0
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

  const formatNumber = (num: number) => String(num).padStart(2, "0");

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
        {timeUntilRelease.days}d {formatNumber(timeUntilRelease.hours)}:
        {formatNumber(timeUntilRelease.minutes)}:
        {formatNumber(timeUntilRelease.seconds)}
      </styled.span>
    </styled.div>
  );
};

export const EventTicketButton = ({ event, ticket, isSoldOut }: Props) => {
  const clerk = useClerk();
  const releaseDate = event?.ticketReleaseDate
    ? toZonedTime(new Date(event.ticketReleaseDate), "UTC")
    : null;

  const isBeforeRelease = releaseDate
    ? isBefore(toZonedTime(new Date(), "UTC"), releaseDate)
    : false;

  if (!event || !event.enableTicketing) {
    return null;
  }

  if (releaseDate && isBeforeRelease) {
    return (
      <>
        <Button disabled w="full" variant="secondary">
          Buy Ticket <RiTicketFill />
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
      <LinkButton to={`/events/${event.id}/ticket`} w="full">
        {ticket.status === TicketStatus.CONFIRMED
          ? "View Ticket"
          : "Continue With Ticket"}
        <RiTicketFill />
      </LinkButton>
    );
  }

  if (isSoldOut) {
    return (
      <Button disabled w="full">
        Sold out <RiTicketFill />
      </Button>
    );
  }

  return (
    <>
      <SignedIn>
        <LinkButton to={`/events/${event.id}/ticket`} w="full">
          Buy Ticket <RiTicketFill />
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
          Buy Ticket <RiTicketFill />
        </Button>
      </SignedOut>
    </>
  );
};
