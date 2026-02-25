import { styled } from "~/styled-system/jsx";
import { format, isBefore } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface TicketType {
  releaseDate: Date | string;
}

interface Props {
  event: { ticketTypes: TicketType[] };
  isSoldOut: boolean;
}

export const EventTicketStatus = ({ event, isSoldOut }: Props) => {
  if (!event?.ticketTypes?.length) {
    return null;
  }

  if (isSoldOut) {
    return (
      <styled.p color="brand.500" fontWeight="semibold" fontSize="sm">
        Sold out
      </styled.p>
    );
  }

  const earliestRelease = event.ticketTypes.reduce<Date | null>((earliest, tt) => {
    const date = new Date(tt.releaseDate);
    return !earliest || date < earliest ? date : earliest;
  }, null);

  if (earliestRelease) {
    const releaseDate = toZonedTime(earliestRelease, "UTC");
    const isBeforeRelease = isBefore(new Date(), releaseDate);

    if (isBeforeRelease) {
      return (
        <styled.p color="brand.500" fontWeight="semibold" fontSize="sm">
          Tickets Release {format(earliestRelease, "MMMM do")}
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
