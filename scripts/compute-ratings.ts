import clc from "cli-color";
import { computeRatings } from "~/utils/computeRatings.server";

computeRatings().catch((error) => {
  console.error(clc.red("Error computing ratings:"), error);
  process.exit(1);
});
