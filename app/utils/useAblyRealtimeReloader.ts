import { useRevalidator } from "react-router";
import { useChannel } from "ably/react";

export const useAblyRealtimeReloader = (channel: string) => {
  const revalidator = useRevalidator();

  const result = useChannel(channel, () => {
    revalidator.revalidate();
  });

  return result;
};
