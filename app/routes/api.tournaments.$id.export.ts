import type { LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { TournamentsState } from "~/utils/enums";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";
import { format } from "date-fns";

function escapeCsv(value: string): string {
  if (/[,"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);

  const tournament = await prisma.tournaments.findFirst({
    where: { id },
    select: {
      name: true,
      state: true,
      drivers: {
        where: {
          driverId: { not: 0 },
        },
        orderBy: { finishingPosition: "asc" },
        select: {
          finishingPosition: true,
          driverId: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  notFoundInvariant(tournament, "Tournament not found");

  if (tournament.state !== TournamentsState.END) {
    throw new Response("Tournament has not ended", { status: 400 });
  }

  const header = ["position", "driverId", "firstname", "lastname"].join(",");
  const rows = tournament.drivers
    .filter((d) => d.finishingPosition != null)
    .map((d) =>
      [
        String(d.finishingPosition),
        String(d.driverId),
        escapeCsv(d.user.firstName ?? ""),
        escapeCsv(d.user.lastName ?? ""),
      ].join(","),
    );
  const csv = [header, ...rows].join("\n");

  const sanitizedName = tournament.name
    .replace(/[–—]/g, "-")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${sanitizedName}-results-${format(new Date(), "dd-MM-yyyy")}.csv"`,
    },
  });
};
