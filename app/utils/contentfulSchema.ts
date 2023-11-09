import { z } from "zod";

export const assetSchema = z.object({
  sys: z.object({
    id: z.string(),
  }),
  fields: z.object({
    file: z.object({
      url: z.string(),
    }),
  }),
});

export const eventSchema = z.object({
  sys: z.object({
    id: z.string(),
  }),
  fields: z.object({
    title: z.string(),
    subTitle: z.string().optional(),
    body: z.unknown(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    ticketUrl: z.string().optional(),
    facebookEventUrl: z.string().optional(),
    slug: z.string(),
    cover: assetSchema,
    card: assetSchema,
  }),
});
