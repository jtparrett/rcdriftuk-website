import { useRevalidator } from "@remix-run/react";
import { useChannel } from "ably/react";

export const useAblyRealtimeReloader = (channel: string) => {
  const revalidator = useRevalidator();

  const result = useChannel(channel, () => {
    revalidator.revalidate();
  });

  return result;
};
