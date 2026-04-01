import { redirect, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import Papa from "papaparse";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const action = async (args: ActionFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  const leaderboard = await prisma.leaderboards.findFirst({
    where: { id, userId },
    select: {
      drivers: { select: { driverId: true } },
    },
  });

  notFoundInvariant(leaderboard, "Leaderboard not found");

  const formData = await args.request.formData();
  const file = z.instanceof(File).parse(formData.get("file"));

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

  const driverIdColumnNames = ["driver id", "driverid", "driver_id", "id"];
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

  const existingDriverIds = new Set(
    leaderboard.drivers.map((d) => d.driverId),
  );
  const seenDriverIds = new Set<number>();
  const driverIds: number[] = [];

  if (hasDriverIdColumn) {
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
        const parts = row[nameColumn]?.trim().split(/\s+/) || [];
        firstName = parts[0];
        lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined;
      }

      if (!firstName) continue;

      const matches = allUsers.filter((u) => {
        const firstMatch =
          u.firstName?.toLowerCase() === firstName!.toLowerCase();
        if (!firstMatch) return false;

        if (lastName) {
          return u.lastName?.toLowerCase() === lastName.toLowerCase();
        }

        return true;
      });

      let matchedDriverId: number | undefined;

      if (matches.length === 1) {
        matchedDriverId = matches[0].driverId;
      } else if (matches.length > 1) {
        const exactMatch = lastName
          ? matches.find(
              (u) => u.lastName?.toLowerCase() === lastName!.toLowerCase(),
            )
          : matches.find((u) => !u.lastName);

        matchedDriverId = exactMatch
          ? exactMatch.driverId
          : matches[0].driverId;
      }

      if (!matchedDriverId) continue;

      if (
        existingDriverIds.has(matchedDriverId) ||
        seenDriverIds.has(matchedDriverId)
      )
        continue;

      driverIds.push(matchedDriverId);
      seenDriverIds.add(matchedDriverId);
    }
  }

  if (driverIds.length > 0) {
    await prisma.leaderboardDrivers.createMany({
      data: driverIds.map((driverId) => ({
        leaderboardId: id,
        driverId,
      })),
      skipDuplicates: true,
    });
  }

  const referer = args.request.headers.get("referer");
  return redirect(referer || `/leaderboards-edit/${id}`);
};
