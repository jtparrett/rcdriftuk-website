import Ably from "ably";
import invariant from "tiny-invariant";

export const createAbly = () => {
  invariant(process.env.ABLY_API_KEY, "ABLY_API_KEY is not set");
  return new Ably.Realtime(process.env.ABLY_API_KEY);
};
