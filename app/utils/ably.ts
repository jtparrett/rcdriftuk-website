import Ably from "ably";

export const ably = new Ably.Realtime({
  authUrl: "/api/ably/auth",
  authMethod: "GET",
});
