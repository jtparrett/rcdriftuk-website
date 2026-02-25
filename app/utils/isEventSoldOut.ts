import type { GetEvent } from "./getEvent.server";

type Params = Pick<NonNullable<GetEvent>, "ticketCapacity"> & {
  _count: Pick<NonNullable<GetEvent>["_count"], "EventTickets">;
};

export const isEventSoldOut = (event: Params | null) => {
  const { ticketCapacity, _count } = event ?? {};
  if (!ticketCapacity || ticketCapacity <= 0) return false;
  return (_count?.EventTickets ?? 0) >= ticketCapacity;
};
