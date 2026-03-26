import { redirect, type LoaderFunctionArgs } from "react-router";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import { tournamentAddDrivers } from "~/utils/tournamentAddDrivers";
import { tournamentCreateBattles } from "~/utils/tournamentCreateBattles";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    return redirect("/sign-in");
  }

  const url = new URL(args.request.url);
  const tournamentId = url.searchParams.get("tournamentId");

  const getTournamentToCopy = async () => {
    if (!tournamentId) {
      return null;
    }

    return prisma.tournaments.findFirst({
      where: { id: tournamentId },
      include: {
        drivers: {
          orderBy: {
            tournamentDriverNumber: "asc",
          },
        },
        judges: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        brackets: {
          orderBy: { id: "asc" },
        },
      },
    });
  };

  const tournamentToClone = await getTournamentToCopy();

  const tournament = await prisma.tournaments.create({
    data: {
      name: "New Tournament",
      userId,
      ...(tournamentToClone
        ? {
            name: `${tournamentToClone.name} (Copy)`,
            enableQualifying: tournamentToClone.enableQualifying,
            qualifyingLaps: tournamentToClone.qualifyingLaps,
            enableProtests: tournamentToClone.enableProtests,
            region: tournamentToClone.region,
            scoreFormula: tournamentToClone.scoreFormula,
            qualifyingOrder: tournamentToClone.qualifyingOrder,
            driverNumbers: tournamentToClone.driverNumbers,
            ratingRequested: tournamentToClone.ratingRequested,
            judgingInterface: tournamentToClone.judgingInterface,
          }
        : {}),
    },
  });

  // Clone brackets or create a default one
  if (tournamentToClone && tournamentToClone.brackets.length > 0) {
    await prisma.tournamentBrackets.createMany({
      data: tournamentToClone.brackets.map((b) => ({
        tournamentId: tournament.id,
        name: b.name,
        bracketSize: b.bracketSize,
        format: b.format,
      })),
    });
  } else {
    await prisma.tournamentBrackets.create({
      data: {
        tournamentId: tournament.id,
        name: "Main",
        bracketSize: 4,
        format: "STANDARD",
      },
    });
  }

  if (tournamentToClone) {
    await tournamentAddDrivers(
      tournament.id,
      tournamentToClone.drivers.map((d) => d.driverId),
    );

    await prisma.tournamentJudges.createMany({
      data: tournamentToClone.judges.map((judge, index) => ({
        tournamentId: tournament.id,
        driverId: judge.driverId,
        points: judge.points,
        sortOrder: index,
        alias: judge.alias,
      })),
    });
  }

  await tournamentCreateBattles(tournament.id);

  return redirect(`/tournaments/${tournament.id}/setup`);
};
