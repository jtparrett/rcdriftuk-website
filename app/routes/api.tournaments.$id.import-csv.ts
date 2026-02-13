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

  const headers = parseResult.meta.fields || [];

  // Detect available columns
  const driverIdColumnNames = [
    "driver id",
    "driverid",
    "driver_id",
    "id",
  ];
  const firstNameColumnNames = [
    "first name",
    "firstname",
    "first_name",
    "first",
  ];
  const lastNameColumnNames = [
    "last name",
    "lastname",
    "last_name",
    "last",
    "surname",
  ];
  const nameColumnNames = ["name", "driver name", "drivername", "driver"];

  const driverIdColumn = headers.find((h) => driverIdColumnNames.includes(h));
  const firstNameColumn = headers.find((h) =>
    firstNameColumnNames.includes(h),
  );
  const lastNameColumn = headers.find((h) => lastNameColumnNames.includes(h));
  const nameColumn = headers.find((h) => nameColumnNames.includes(h));

  const hasDriverIdColumn = !!driverIdColumn;
  const hasNameColumns = !!(firstNameColumn || nameColumn);

  if (!hasDriverIdColumn && !hasNameColumns) {
    throw new Response(
      "CSV must have either a 'Driver ID' column, or 'First Name'/'Last Name' columns (or a 'Name' column). Found columns: " +
        headers.join(", "),
      { status: 400 },
    );
  }

  // Track drivers already in the tournament to avoid duplicates
  const existingDriverIds = new Set(tournament.drivers.map((d) => d.driverId));
  const seenDriverIds = new Set<number>();

  // Collect ordered driver IDs — one per CSV row
  const driverIds: number[] = [];

  if (hasDriverIdColumn) {
    // ── Strategy 1: Match by driver ID column ──
    // Collect all candidate IDs first, then batch-verify
    const rowDriverIds: (number | null)[] = [];

    for (const row of parseResult.data) {
      const driverIdStr = row[driverIdColumn!]?.trim();
      if (!driverIdStr) {
        rowDriverIds.push(null);
        continue;
      }
      const parsed = Number(driverIdStr);
      rowDriverIds.push(isNaN(parsed) || parsed <= 0 ? null : parsed);
    }

    // Batch-verify which driver IDs exist in the database
    const candidateIds = rowDriverIds.filter(
      (id): id is number => id !== null,
    );
    const existingUsers = await prisma.users.findMany({
      where: { driverId: { in: candidateIds } },
      select: { driverId: true },
    });
    const validDriverIds = new Set(existingUsers.map((u) => u.driverId));

    for (const driverId of rowDriverIds) {
      if (driverId === null) continue;
      if (existingDriverIds.has(driverId) || seenDriverIds.has(driverId))
        continue;
      if (!validDriverIds.has(driverId)) continue;

      driverIds.push(driverId);
      seenDriverIds.add(driverId);
    }
  } else {
    // ── Strategy 2: Match by name, create if not found ──
    // Fetch all non-archived users for name matching
    const allUsers = await prisma.users.findMany({
      where: { archived: false },
      select: {
        driverId: true,
        firstName: true,
        lastName: true,
      },
    });

    for (const row of parseResult.data) {
      let firstName: string | undefined;
      let lastName: string | undefined;

      if (firstNameColumn) {
        firstName = row[firstNameColumn]?.trim();
        lastName = lastNameColumn ? row[lastNameColumn]?.trim() : undefined;
      } else if (nameColumn) {
        // Split a full name into first/last
        const parts = row[nameColumn]?.trim().split(/\s+/) || [];
        firstName = parts[0];
        lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined;
      }

      if (!firstName) continue;

      // Try to find a matching user (case-insensitive)
      const matches = allUsers.filter((u) => {
        const firstMatch =
          u.firstName?.toLowerCase() === firstName!.toLowerCase();
        if (!firstMatch) return false;

        if (lastName) {
          return u.lastName?.toLowerCase() === lastName.toLowerCase();
        }

        // Single name — match firstName only
        return true;
      });

      let matchedDriverId: number | undefined;

      if (matches.length === 1) {
        matchedDriverId = matches[0].driverId;
      } else if (matches.length > 1) {
        // Multiple matches — prefer exact firstName+lastName, or firstName with null lastName for single names
        const exactMatch = lastName
          ? matches.find(
              (u) => u.lastName?.toLowerCase() === lastName!.toLowerCase(),
            )
          : matches.find((u) => !u.lastName);

        matchedDriverId = exactMatch
          ? exactMatch.driverId
          : matches[0].driverId;
      }

      if (matchedDriverId) {
        // Skip if already in tournament or already seen in this CSV
        if (
          existingDriverIds.has(matchedDriverId) ||
          seenDriverIds.has(matchedDriverId)
        )
          continue;

        driverIds.push(matchedDriverId);
        seenDriverIds.add(matchedDriverId);
      } else {
        // No match — create a new driver
        const newUser = await prisma.users.create({
          data: {
            firstName,
            lastName: lastName || null,
          },
        });

        driverIds.push(newUser.driverId);
        seenDriverIds.add(newUser.driverId);
      }
    }
  }

  // Add the drivers to the tournament (order is preserved)
  if (driverIds.length > 0) {
    await tournamentAddDrivers(id, driverIds, {
      createLaps: tournament.state !== TournamentsState.START,
    });
  }

  // Redirect back to the referrer or the setup page
  const referer = args.request.headers.get("referer");
  return redirect(referer || `/tournaments/${id}/setup`);
};
