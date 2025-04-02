import type { GetEvent } from "~/utils/getEvent.server";

import { styled } from "~/styled-system/jsx";
import { format, isBefore } from "date-fns";
import { getTime } from "~/utils/getEventDate";
interface Props {
  event: Pick<NonNullable<GetEvent>, "enableTicketing" | "ticketReleaseDate">;
  isSoldOut: boolean;
}

export const EventTicketStatus = ({ event, isSoldOut }: Props) => {
  if (!event?.enableTicketing) {
    return null;
  }

  if (isSoldOut) {
    return (
      <styled.p color="brand.500" fontWeight="semibold" fontSize="sm">
        Sold out
      </styled.p>
    );
  }

  if (event.ticketReleaseDate) {
    const ticketReleaseDate = new Date(event.ticketReleaseDate);
    const today = new Date();

    if (isBefore(today, ticketReleaseDate)) {
      return (
        <styled.p color="brand.500" fontWeight="semibold" fontSize="sm">
          Tickets Release {format(ticketReleaseDate, "do MMM, yyyy")}{" "}
          {getTime(ticketReleaseDate)}
        </styled.p>
      );
    }
  }

  return (
    <styled.p color="brand.500" fontWeight="semibold" fontSize="sm">
      Tickets on sale
    </styled.p>
  );
};
