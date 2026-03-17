import { computeRatings } from "~/utils/computeRatings.server";

export const maxDuration = 800;

export const loader = async () => {
  await computeRatings();
  return null;
};
