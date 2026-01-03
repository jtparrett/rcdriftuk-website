import Ably from "ably";

export const createAbly = () => {
  return new Ably.Realtime(process.env.ABLY_API_KEY!);
};
