import clc from "cli-color";
import { isAfter } from "date-fns";
import { calculateElos } from "~/utils/calculateElos";
import { Regions } from "~/utils/enums";
import { calculateInactivityPenaltyOverPeriod } from "~/utils/inactivityPenalty.server";
import { prisma } from "~/utils/prisma.server";

const MAJOR_MULTIPLIER = 1.5;

const MAJOR_TOURANMENTS = [
  "35788ae3-9cd2-46e4-b295-1bb26cbeec25",
  "319ea746-1c5f-4361-a9b5-a0aebacb2405",
  "b324565b-539a-4ed5-99b3-0df733af1a6e",
  "6aa1bebf-7400-4fc4-a55e-6e99605578d9",
];

const driverLastTournamentDate: Record<number, Date> = {};
const driverTotalBattles: Record<number, number> = {};

// DO NOT PASS IN Regions.ALL
const computeRatingsForRegion = async (region: Regions) => {
  const battles = await prisma.tournamentBattles.findMany({
    where: {
      tournament: {
        rated: true,
        region,
      },
    },
    orderBy: [
      {
        tournament: {
          createdAt: "asc",
        },
      },
      { round: "asc" },
      { bracket: "asc" },
      {
        id: "asc",
      },
    ],
    select: {
      id: true,
      round: true,
      winnerId: true,
      driverLeftId: true,
      driverRightId: true,
      tournamentId: true,
      createdAt: true,
      driverLeft: {
        select: {
          driverId: true,
          isBye: true,
          user: {
            select: {
              driverId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      driverRight: {
        select: {
          driverId: true,
          isBye: true,
          user: {
            select: {
              driverId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      tournament: {
        select: {
          name: true,
          createdAt: true,
        },
      },
    },
  });

  console.log(clc.blue(`Found ${battles.length} battles to process`));

  if (battles.length === 0) {
    console.log(clc.blue("Nothing to process for this region."));
    return;
  }

  const driverElos: Record<number, number> = {};
  // BYE driver, not ranked
  driverElos[0] = 1000;

  // Process each battle in chronological order
  for (const [_index, battle] of battles.entries()) {
    if (battle.winnerId === null) {
      console.log(clc.yellow(`Skipping battle ${battle.id} - no winner`));
      continue;
    }

    const loserTournamentDriverId =
      battle.driverLeftId === battle.winnerId
        ? battle.driverRightId
        : battle.driverLeftId;

    if (loserTournamentDriverId === null) {
      console.log(clc.yellow(`Skipping battle ${battle.id} - no loser`));
      continue;
    }

    const winner =
      battle.driverLeftId === battle.winnerId
        ? battle.driverLeft
        : battle.driverRight;

    const loser =
      battle.driverLeftId === loserTournamentDriverId
        ? battle.driverLeft
        : battle.driverRight;

    if (!winner || !loser) {
      console.log(clc.yellow(`Skipping battle ${battle.id} - missing driver`));
      continue;
    }

    const winnerId = winner.driverId;
    const loserId = loser.driverId;

    // Initialize ELOs if not already set
    const winnerBaseElo = (driverElos[winnerId] =
      driverElos?.[winnerId] ?? 1000);

    const loserBaseElo = (driverElos[loserId] = driverElos?.[loserId] ?? 1000);

    driverTotalBattles[winnerId] = (driverTotalBattles[winnerId] ?? 0) + 1;
    driverTotalBattles[loserId] = (driverTotalBattles[loserId] ?? 0) + 1;

    // Calculate inactivity penalties
    let winnerInactivityPenalty = 0;
    let loserInactivityPenalty = 0;

    const tournamentDate = battle.tournament.createdAt;
    const winnerLastTournamentDate = driverLastTournamentDate[winnerId];
    const loserLastTournamentDate = driverLastTournamentDate[loserId];

    if (winnerLastTournamentDate) {
      winnerInactivityPenalty = calculateInactivityPenaltyOverPeriod(
        winnerLastTournamentDate,
        tournamentDate,
      );
    }

    if (loserId !== 0 && loserLastTournamentDate) {
      loserInactivityPenalty = calculateInactivityPenaltyOverPeriod(
        loserLastTournamentDate,
        tournamentDate,
      );
    }

    // Update last battle dates (use tournament date so all participants get the same reference)
    driverLastTournamentDate[winnerId] =
      !winnerLastTournamentDate ||
      isAfter(tournamentDate, winnerLastTournamentDate)
        ? tournamentDate
        : winnerLastTournamentDate;

    if (loserId !== 0) {
      driverLastTournamentDate[loserId] =
        !loserLastTournamentDate ||
        isAfter(tournamentDate, loserLastTournamentDate)
          ? tournamentDate
          : loserLastTournamentDate;
    }

    // Apply penalties to starting ELOs
    const winnerStartingElo = Math.max(
      0,
      winnerBaseElo + winnerInactivityPenalty,
    );
    const loserStartingElo = Math.max(0, loserBaseElo + loserInactivityPenalty);

    let winnersK = driverTotalBattles[winnerId] >= 4 ? 32 : 64;

    const losersK = 32;

    // Increase K-factor for tournament finals
    if (MAJOR_TOURANMENTS.includes(battle.tournamentId)) {
      winnersK *= MAJOR_MULTIPLIER;
    }

    // Calculate new ELOs
    const { winnerElo, loserElo } = calculateElos(
      winnerStartingElo,
      loserStartingElo,
      winnersK,
      losersK,
    );

    // Update driver ELOs (store the new ELO without penalty for next battle's base)
    driverElos[winnerId] = winnerElo;
    driverElos[loserId] = loserElo;

    // Update battle with points
    await prisma.tournamentBattles.update({
      where: { id: battle.id },
      data: {
        winnerRegionalElo: winnerElo,
        loserRegionalElo: loserElo,
        winnerRegionalStartingElo: winnerStartingElo,
        loserRegionalStartingElo: loserStartingElo,
        winnerInactivityPenalty,
        loserInactivityPenalty,
      },
    });

    const winnerPoints = winnerElo - winnerStartingElo;
    const loserPoints = loserElo - loserStartingElo;

    console.log(
      clc.bgMagenta(
        `Battle ${battle.id}, ${battle.tournament.name} (K: ${winnersK}) (${battle.round}):`,
      ),
    );

    if (winnerInactivityPenalty !== 0) {
      console.log(
        clc.cyan(
          `   ${winner.user.firstName} ${winner.user.lastName} inactivity penalty: ${winnerInactivityPenalty}`,
        ),
      );
    }

    console.log(
      clc.green(
        `   ${winner.user.firstName} ${winner.user.lastName} won ${winnerPoints} points (Total: ${winnerElo.toFixed(3)})`,
      ),
    );

    if (loserInactivityPenalty !== 0) {
      console.log(
        clc.cyan(
          `   ${loser.user.firstName} ${loser.user.lastName} inactivity penalty: ${loserInactivityPenalty}`,
        ),
      );
    }

    console.log(
      clc.red(
        `   ${loser.user.firstName} ${loser.user.lastName} lost ${loserPoints} points (Total: ${loserElo.toFixed(3)})`,
      ),
    );
  }

  // Update all users with their final ELO scores (skip BYE driver 0)
  console.log(clc.blue("\nUpdating user ELO scores..."));

  for (const [driverIdStr, elo] of Object.entries(driverElos)) {
    const driverId = parseInt(driverIdStr, 10);

    if (driverId === 0) continue; // BYE driver, no user row

    await prisma.users.update({
      where: { driverId },
      data: {
        [`elo_${region}`]: elo,
        lastTournamentDate: driverLastTournamentDate[driverId],
        ranked: driverTotalBattles[driverId] >= 4,
      },
    });
    console.log(
      clc.blue(`Updated driver ${driverId} with ELO: ${elo.toFixed(3)}`),
    );
  }

  console.log(clc.green("Rating computation complete!"));
};

const run = async () => {
  await computeRatingsForRegion(Regions.UK);
  await computeRatingsForRegion(Regions.EU);
  await computeRatingsForRegion(Regions.NA);
  await computeRatingsForRegion(Regions.ZA);
  await computeRatingsForRegion(Regions.LA);
  await computeRatingsForRegion(Regions.AP);
};

run().catch((error) => {
  console.error(clc.red("Error computing ratings:"), error);
  process.exit(1);
});
