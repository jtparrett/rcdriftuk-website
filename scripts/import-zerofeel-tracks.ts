import slugify from "slugify";
import { z } from "zod";
import { Regions, TrackStatus } from "~/utils/enums";
import { prisma } from "~/utils/prisma.server";

const TOKEN = "rcdio_9f3KQ2Vx8HnE7bW4JmZcT6A5RPLDUs0aYF1iOqS";

const parseCSV = (csv: string) => {
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return headers.reduce(
      (obj, header, i) => {
        obj[header] = values[i] || "";
        return obj;
      },
      {} as Record<string, string>,
    );
  });
};

const run = async () => {
  const response = await fetch(
    "https://jxhcwzgmycdudjnxvjvh.functions.supabase.co/rcdio-locations",
    {
      headers: {
        "x-rcdio-token": TOKEN,
      },
    },
  );
  const text = await response.text();
  const data = parseCSV(text);

  const results = z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        image: z.string(),
        lat: z.string(),
        lng: z.string(),
        url: z.string(),
        address: z.string(),
        cover: z.string(),
      }),
    )
    .parse(data);

  const resultsWithSlugs = results.map((a) => {
    const slug = slugify(a.name, {
      lower: true,
      strict: true,
    });

    return {
      name: a.name,
      description: a.description,
      url: a.url,
      address: a.address,
      slug,
      lat: parseFloat(a.lat),
      lng: parseFloat(a.lng),
      region: Regions.AP,
      status: TrackStatus.ACTIVE,
      image: a.cover !== "" ? a.cover : "https://rcdrift.io/blank-map-pin.jpg",
    };
  });

  await prisma.$transaction([
    prisma.tracks.deleteMany({
      where: {
        region: Regions.AP,
      },
    }),
    prisma.tracks.createMany({
      data: resultsWithSlugs,
    }),
  ]);
};

run();
