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
            format: tournamentToClone.format,
            enableProtests: tournamentToClone.enableProtests,
            region: tournamentToClone.region,
            scoreFormula: tournamentToClone.scoreFormula,
            qualifyingOrder: tournamentToClone.qualifyingOrder,
            driverNumbers: tournamentToClone.driverNumbers,
            bracketSize: tournamentToClone.bracketSize,
            ratingRequested: tournamentToClone.ratingRequested,
            judgingInterface: tournamentToClone.judgingInterface,
          }
        : {}),
    },
  });

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

    const sourceStages = await prisma.tournamentBattleStages.findMany({
      where: { tournamentId: tournamentToClone.id },
      orderBy: { sortOrder: "asc" },
    });
    for (let i = 0; i < sourceStages.length; i++) {
      const s = sourceStages[i]!;
      await prisma.tournamentBattleStages.create({
        data: {
          tournamentId: tournament.id,
          name: s.name,
          sortOrder: i + 1,
          bracketSize: s.bracketSize,
          format: s.format,
        },
      });
    }
  }

  const stageCount = await prisma.tournamentBattleStages.count({
    where: { tournamentId: tournament.id },
  });
  if (stageCount > 0) {
    await tournamentCreateBattles(tournament.id);
  }

  return redirect(`/tournaments/${tournament.id}/setup`);
};
