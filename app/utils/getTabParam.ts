import { TrackTypes } from "@prisma/client";
import { z } from "zod";

export const getTabParam = (param?: string) => {
  return z.nativeEnum(TrackTypes).parse(param?.toUpperCase());
};
