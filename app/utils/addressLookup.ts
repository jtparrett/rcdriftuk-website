import { z } from "zod";

const addressLookupSchema = z.object({
  lat: z.string(),
  lon: z.string(),
  display_name: z.string(),
});

export type AddressLookup = z.infer<typeof addressLookupSchema>;

export const addressLookup = async (search: string) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json`
  );
  const data = await response.json();

  return z.array(addressLookupSchema).parse(data);
};
