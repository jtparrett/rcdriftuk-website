import type { GetEvent } from "~/utils/getEvent.server";

import { styled } from "~/styled-system/jsx";
import { format, isBefore } from "date-fns";
import { toZonedTime } from "date-fns-tz";
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
    const releaseDate = event?.ticketReleaseDate
      ? toZonedTime(new Date(event.ticketReleaseDate), "UTC")
      : null;

    const isBeforeRelease = releaseDate
      ? isBefore(new Date(), releaseDate)
      : false;

    if (isBeforeRelease) {
      return (
        <styled.p color="brand.500" fontWeight="semibold" fontSize="sm">
          Tickets Release {format(ticketReleaseDate, "MMMM do")}
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
