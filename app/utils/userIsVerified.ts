import type { GetUser } from "./getUser.server";

export const userIsVerified = (user: GetUser) => {
  return user?.ranked || (user?.Tracks.length ?? 0) > 0;
};
