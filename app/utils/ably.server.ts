import Ably from "ably";

export const createAbly = (token: string) => {
  return new Ably.Realtime(token);
};
