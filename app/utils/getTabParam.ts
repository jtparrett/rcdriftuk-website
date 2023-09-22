import { z } from "zod";

export const getTabParam = (param: any) => {
  return z.enum(["all", "tracks", "clubs", "shops"]).parse(param);
};
