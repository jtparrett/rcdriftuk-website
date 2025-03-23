import type { GetEvent } from "~/utils/getEvent.server";

import { styled } from "~/styled-system/jsx";
import { format, isBefore } from "date-fns";

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

  if (
    event.ticketReleaseDate &&
    isBefore(new Date(), new Date(event.ticketReleaseDate))
  ) {
    return (
      <styled.p color="brand.500" fontWeight="semibold" fontSize="sm">
        Tickets Release{" "}
        {format(new Date(event.ticketReleaseDate), "do MMM, yyyy h:mma")}
      </styled.p>
    );
  }

  return (
    <styled.p color="brand.500" fontWeight="semibold" fontSize="sm">
      Tickets on sale
    </styled.p>
  );
};
