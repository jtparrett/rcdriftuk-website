import Ably from "ably";

export const ably = new Ably.Realtime({
  authUrl: "https://rcdrift.uk/api/ably/auth",
  authMethod: "GET",
});
