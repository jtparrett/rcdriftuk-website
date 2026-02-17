import clc from "cli-color";
import { calculateElos } from "~/utils/calculateElos";
import { Regions } from "~/utils/enums";
import { calculateInactivityPenaltyOverPeriod } from "~/utils/inactivityPenalty.server";
import { prisma } from "~/utils/prisma.server";

/** Set to false to only compute ratings for battles that don't have ELO yet (incremental). Override with env: COMPUTE_FULL_RATINGS=false */
const COMPUTE_FULL_RATINGS = true;

const MAJOR_MULTIPLIER = 1.5;

const MAJOR_TOURANMENTS = [
  "35788ae3-9cd2-46e4-b295-1bb26cbeec25",
  "319ea746-1c5f-4361-a9b5-a0aebacb2405",
  "b324565b-539a-4ed5-99b3-0df733af1a6e",
  "6aa1bebf-7400-4fc4-a55e-6e99605578d9",
];

const computeRatingsForRegion = async (
  region: Regions,
  full: boolean = COMPUTE_FULL_RATINGS,
) => {
  console.log(
    clc.green(
      full
        ? "Computing full ratings..."
        : "Computing new (incremental) ratings...",
    ),
  );

  const battles = await prisma.tournamentBattles.findMany({
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
    where: {
      tournament: {
        rated: true,
        ...(region !== Regions.ALL && { region }),
      },
      ...(full
        ? {}
        : region === Regions.ALL
          ? { winnerElo: null }
          : { winnerRegionalElo: null }),
    },
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
  const driverLastBattleDate: Record<number, Date> = {};

  if (!full) {
    // Incremental: seed ELO and lastBattleDate from current User state
    const driverIds = new Set<number>();
    for (const b of battles) {
      if (b.driverLeft?.driverId != null) driverIds.add(b.driverLeft.driverId);
      if (b.driverRight?.driverId != null)
        driverIds.add(b.driverRight.driverId);
    }
    const eloField = region === Regions.ALL ? "elo" : `elo_${region}`;
    const users = await prisma.users.findMany({
      where: {
        driverId: {
          in: [...driverIds],
        },
      },
      select: {
        driverId: true,
        lastBattleDate: true,
        elo: true,
        elo_UK: true,
        elo_EU: true,
        elo_NA: true,
        elo_ZA: true,
        elo_LA: true,
        elo_AP: true,
      },
    });
    for (const u of users) {
      const elo = (u as Record<string, number | null>)[eloField];
      driverElos[u.driverId] = elo != null ? elo : 1000;
      if (u.lastBattleDate) driverLastBattleDate[u.driverId] = u.lastBattleDate;
    }
    // BYE driver
    driverElos[0] = 1000;
    console.log(
      clc.blue(
        `Seeded ${users.length} drivers from current ELO (${battles.length} new battles).`,
      ),
    );
  }

  // Process each battle in chronological order
  for (const [index, battle] of battles.entries()) {
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

    // 0 = BYE driver
    const loserBaseElo = (driverElos[loserId] =
      loserId === 0 ? 1000 : driverElos?.[loserId] ?? 1000);

    // Calculate inactivity penalties
    let winnerInactivityPenalty = 0;
    let loserInactivityPenalty = 0;

    if (driverLastBattleDate[winnerId]) {
      winnerInactivityPenalty = calculateInactivityPenaltyOverPeriod(
        driverLastBattleDate[winnerId],
        battle.createdAt,
      );
    }

    if (loserId !== 0 && driverLastBattleDate[loserId]) {
      loserInactivityPenalty = calculateInactivityPenaltyOverPeriod(
        driverLastBattleDate[loserId],
        battle.createdAt,
      );
    }

    // Apply penalties to starting ELOs
    const winnerStartingElo = Math.max(
      0,
      winnerBaseElo + winnerInactivityPenalty,
    );
    const loserStartingElo = Math.max(0, loserBaseElo + loserInactivityPenalty);

    // Count previous battles for K-factor calculation
    const winnerTotalBattles = [...battles].slice(0, index).filter((b) => {
      return (
        b.driverLeft?.driverId === winnerId ||
        b.driverRight?.driverId === winnerId
      );
    }).length;

    // Calculate K-factor
    let winnersK = winnerTotalBattles >= 5 ? 32 : 64;
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

    // Update last battle dates
    driverLastBattleDate[winnerId] = battle.createdAt;
    if (loserId !== 0) {
      driverLastBattleDate[loserId] = battle.createdAt;
    }

    // Update battle with points
    if (region == Regions.ALL) {
      await prisma.tournamentBattles.update({
        where: { id: battle.id },
        data: {
          winnerElo,
          loserElo,
          winnerStartingElo,
          loserStartingElo,
          winnerInactivityPenalty,
          loserInactivityPenalty,
        },
      });
    } else {
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
    }

    const winnerPoints = winnerElo - winnerStartingElo;
    const loserPoints = loserElo - loserStartingElo;

    console.log(
      clc.bgMagenta(
        `Battle ${battle.id}, ${battle.tournament.name} (totalwins: ${winnerTotalBattles}) (${battle.round}):`,
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

    const eloField = region === Regions.ALL ? "elo" : `elo_${region}`;

    await prisma.users.update({
      where: { driverId },
      data: {
        [eloField]: elo,
        lastBattleDate: driverLastBattleDate[driverId],
      },
    });
    console.log(
      clc.blue(`Updated driver ${driverId} with ELO: ${elo.toFixed(3)}`),
    );
  }

  console.log(clc.green("Rating computation complete!"));
};

const rankUnrankedDrivers = async () => {
  console.log(clc.blue("Finding unranked drivers with at least 3 battles..."));

  const updated = await prisma.$executeRaw`
    WITH battle_participants AS (
      SELECT td."driverId"
      FROM "TournamentBattles" b
      INNER JOIN "Tournaments" t ON t.id = b."tournamentId" AND t.rated = true
      INNER JOIN "TournamentDrivers" td ON td.id = b."driverLeftId"
      WHERE b."driverLeftId" IS NOT NULL
      UNION ALL
      SELECT td."driverId"
      FROM "TournamentBattles" b
      INNER JOIN "Tournaments" t ON t.id = b."tournamentId" AND t.rated = true
      INNER JOIN "TournamentDrivers" td ON td.id = b."driverRightId"
      WHERE b."driverRightId" IS NOT NULL
    ),
    driver_battle_counts AS (
      SELECT "driverId", COUNT(*) AS battle_count
      FROM battle_participants
      GROUP BY "driverId"
      HAVING COUNT(*) >= 3
    )
    UPDATE "Users" u
    SET ranked = true
    FROM driver_battle_counts dbc
    WHERE u."driverId" = dbc."driverId"
      AND u.ranked = false
  `;

  console.log(
    clc.green(
      `Updated ${updated} unranked driver(s) to ranked (had ≥3 battles).`,
    ),
  );
};

const run = async () => {
  const full = COMPUTE_FULL_RATINGS;
  console.log(
    clc.bgBlue(
      full
        ? "Full ratings compute (all battles, all drivers from 1000)"
        : "Incremental: only new battles, seed from current ELO",
    ),
  );

  await rankUnrankedDrivers();

  await computeRatingsForRegion(Regions.ALL, full);
  await computeRatingsForRegion(Regions.UK, full);
  await computeRatingsForRegion(Regions.EU, full);
  await computeRatingsForRegion(Regions.NA, full);
  await computeRatingsForRegion(Regions.ZA, full);
  await computeRatingsForRegion(Regions.LA, full);
  await computeRatingsForRegion(Regions.AP, full);
};

run().catch((error) => {
  console.error(clc.red("Error computing ratings:"), error);
  process.exit(1);
});
