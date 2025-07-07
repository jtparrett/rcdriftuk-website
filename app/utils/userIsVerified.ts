import type { GetUser } from "./getUser.server";

export const userIsVerified = (user: GetUser) => {
  return (user?.totalBattles ?? 0) > 0 || (user?.Tracks.length ?? 0) > 0;
};
