import { RiTicketFill } from "react-icons/ri";
import { Button, LinkButton } from "./Button";
import { TicketStatus } from "@prisma/client";
import type { GetEvent } from "~/utils/getEvent.server";
import { SignedIn, SignedOut, useClerk } from "@clerk/remix";
import { format, isBefore } from "date-fns";
import { styled } from "~/styled-system/jsx";
import type { GetUserEventTicket } from "~/utils/getUserEventTicket.server";
import { toZonedTime } from "date-fns-tz";

interface Props {
  event: GetEvent;
  ticket: GetUserEventTicket;
  isSoldOut: boolean;
}

export const EventTicketButton = ({ event, ticket, isSoldOut }: Props) => {
  const clerk = useClerk();
  const releaseDate = event?.ticketReleaseDate
    ? toZonedTime(new Date(event.ticketReleaseDate), "UTC")
    : null;

  if (!event || !event.enableTicketing) {
    return null;
  }

  if (releaseDate && isBefore(toZonedTime(new Date(), "UTC"), releaseDate)) {
    return (
      <styled.p fontSize="sm" color="brand.500" fontWeight="bold">
        Tickets Release {format(releaseDate, "do MMM, yyyy h:mma")}
      </styled.p>
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
