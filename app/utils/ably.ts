import Ably from "ably";

export const ably = new Ably.Realtime({
  authUrl: "https://rcdrift.io/api/ably/auth",
  authMethod: "GET",
});
