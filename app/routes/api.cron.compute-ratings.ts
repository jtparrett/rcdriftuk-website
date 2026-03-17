import { computeRatings } from "~/utils/computeRatings.server";

export const loader = async () => {
  await computeRatings();
  return null;
};
