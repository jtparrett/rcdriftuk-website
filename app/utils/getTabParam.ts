import { TrackTypes } from "~/utils/enums";
import { z } from "zod";

export const getTabParam = (param?: string) => {
  return z.nativeEnum(TrackTypes).parse(param?.toUpperCase());
};
