import type { GetEvent } from "./getEvent.server";

type Params = Pick<NonNullable<GetEvent>, "ticketCapacity"> & {
  _count: Pick<NonNullable<GetEvent>["_count"], "EventTickets">;
};

export const isEventSoldOut = (event: Params | null) => {
  const { ticketCapacity, _count } = event ?? {};
  return ticketCapacity !== null && ticketCapacity !== undefined
    ? (_count?.EventTickets ?? ticketCapacity) >= ticketCapacity
    : false;
};
