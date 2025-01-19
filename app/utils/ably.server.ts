import Ably from "ably";
import invariant from "tiny-invariant";

invariant(process.env.ABLY_API_KEY, "ABLY_API_KEY is not set");

export const ably = new Ably.Realtime(process.env.ABLY_API_KEY);
