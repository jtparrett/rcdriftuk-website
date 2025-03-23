import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { id } = params;
  const { userId } = await getAuth({ request, params } as ActionFunctionArgs);

  invariant(userId, "User must be logged in");
  invariant(id, "Tournament ID is required");

  // Check if user owns the tournament
  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!tournament) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const csvFile = formData.get("csv") as File;

  if (!csvFile) {
    return new Response("No CSV file provided", { status: 400 });
  }

  const csvText = await csvFile.text();
  const lines = csvText.split("\n");

  // Get header row and find Driver ID column index
  const headers = lines[0].split(",").map((h) => h.trim());
  const driverIdColumnIndex = headers.findIndex((h) => h === "Driver ID");

  if (driverIdColumnIndex === -1) {
    return new Response("CSV must contain a 'Driver ID' column", {
      status: 400,
    });
  }

  // Parse driver IDs from CSV
  const driverIds = lines
    .slice(1) // Skip header row
    .map((line) => line.split(",")[driverIdColumnIndex]?.trim())
    .filter(Boolean)
    .map((id) => Number(id));

  if (driverIds.length === 0) {
    return new Response("No valid driver IDs found in CSV", { status: 400 });
  }

  // Create tournament drivers
  await prisma.tournamentDrivers.createMany({
    data: driverIds.map((driverId) => ({
      driverId,
      tournamentId: id,
    })),
    skipDuplicates: true,
  });

  return redirect(`/tournaments/${id}`);
};
