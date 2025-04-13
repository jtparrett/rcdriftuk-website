import { z } from "zod";

export const addressToLatLng = async (address: string) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${address}&format=json`
  );
  const data = await response.json();

  const [{ lat, lon }] = z
    .array(
      z.object({
        lat: z.string(),
        lon: z.string(),
      })
    )
    .parse(data);

  return {
    lat,
    lng: lon,
  };
};
