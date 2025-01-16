import { RiTicketFill } from "react-icons/ri";
import { Button, LinkButton } from "./Button";
import { TicketStatus } from "@prisma/client";
import type { GetEvent } from "~/utils/getEvent.server";
import { SignedIn, SignedOut, useClerk } from "@clerk/remix";
import { format, isBefore } from "date-fns";
import { styled } from "~/styled-system/jsx";
import type { GetUserEventTicket } from "~/utils/getUserEventTicket.server";

interface Props {
  event: GetEvent;
  ticket: GetUserEventTicket;
  isSoldOut: boolean;
}

export const EventTicketButton = ({ event, ticket, isSoldOut }: Props) => {
  const clerk = useClerk();

  if (!event || !event.enableTicketing) {
    return null;
  }

  if (
    event.ticketReleaseDate &&
    isBefore(new Date(), new Date(event.ticketReleaseDate))
  ) {
    return (
      <styled.p fontSize="sm" color="brand.500">
        Tickets Release{" "}
        {format(new Date(event.ticketReleaseDate), "do MMM, yyyy h:mma")}
      </styled.p>
    );
  }

  if (
    ticket &&
    (ticket.status === TicketStatus.CONFIRMED ||
      ticket.status === TicketStatus.PENDING)
  ) {
    return (
      <LinkButton to={`/events/${event.id}/ticket`}>
        {ticket.status === TicketStatus.CONFIRMED
          ? "View Ticket"
          : "Continue With Ticket"}
        <RiTicketFill />
      </LinkButton>
    );
  }

  if (isSoldOut) {
    return (
      <Button disabled>
        Sold Out <RiTicketFill />
      </Button>
    );
  }

  return (
    <>
      <SignedIn>
        <LinkButton to={`/events/${event.id}/ticket`}>
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
        >
          Buy Ticket <RiTicketFill />
        </Button>
      </SignedOut>
    </>
  );
};
