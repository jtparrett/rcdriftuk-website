import { redirect, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import Papa from "papaparse";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";
import { tournamentAddDrivers } from "~/utils/tournamentAddDrivers";
import { TournamentsState } from "~/utils/enums";

export const action = async (args: ActionFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  // Verify tournament exists and user owns it
  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      state: true,
      drivers: {
        select: {
          driverId: true,
        },
      },
    },
  });

  notFoundInvariant(tournament, "Tournament not found");

  // Only allow importing in START or QUALIFYING state
  const canEditDrivers =
    tournament.state === TournamentsState.START ||
    tournament.state === TournamentsState.QUALIFYING;

  if (!canEditDrivers) {
    throw new Response("Cannot import drivers during battles", { status: 400 });
  }

  const formData = await args.request.formData();
  const file = z.instanceof(File).parse(formData.get("file"));

  // Read and parse the CSV using papaparse
  const csvText = await file.text();
  const parseResult = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
    throw new Response("Failed to parse CSV file", { status: 400 });
  }

  if (parseResult.data.length === 0) {
    throw new Response("CSV file is empty", { status: 400 });
  }

  // Find the driver ID column (try various common names)
  const driverIdColumnNames = [
    "driver id",
    "driverid",
    "driver_id",
    "id",
    "Driver ID",
  ];
  const headers = parseResult.meta.fields || [];
  const driverIdColumn = headers.find((h) => driverIdColumnNames.includes(h));

  if (!driverIdColumn) {
    throw new Response(
      "CSV must have a 'Driver ID' column. Found columns: " +
        headers.join(", "),
      { status: 400 },
    );
  }

  // Parse driver IDs from CSV
  const existingDriverIds = new Set(tournament.drivers.map((d) => d.driverId));
  const parsedDriverIds: number[] = [];

  for (const row of parseResult.data) {
    const driverIdStr = row[driverIdColumn]?.trim();

    if (!driverIdStr) continue;

    const driverId = Number(driverIdStr);

    if (isNaN(driverId) || driverId <= 0) {
      continue; // Skip invalid driver IDs
    }

    // Skip if driver is already in the tournament or already parsed
    if (existingDriverIds.has(driverId)) {
      continue;
    }

    parsedDriverIds.push(driverId);
    existingDriverIds.add(driverId); // Prevent duplicates within the CSV
  }

  // Batch verify which drivers exist in the database
  const existingUsers = await prisma.users.findMany({
    where: {
      driverId: { in: parsedDriverIds },
    },
    select: { driverId: true },
  });

  const validDriverIds = new Set(existingUsers.map((u) => u.driverId));
  const driverIds = parsedDriverIds.filter((id) => validDriverIds.has(id));

  // Add the drivers to the tournament
  if (driverIds.length > 0) {
    await tournamentAddDrivers(id, driverIds, {
      createLaps: tournament.state !== TournamentsState.START,
    });
  }

  // Redirect back to the referrer or the setup page
  const referer = args.request.headers.get("referer");
  return redirect(referer || `/tournaments/${id}/setup`);
};
