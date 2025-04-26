import clc from "cli-color";
import { calculateElos } from "~/utils/calculateElos";
import { prisma } from "~/utils/prisma.server";

const run = async () => {
  console.log(clc.green("Computing ratings..."));

  // Get all battles ordered by creation date
  const battles = await prisma.tournamentBattles.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    where: {
      tournament: {
        rated: true,
      },
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

  const driverElos: Record<number, number> = {};

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
    const winnerStartingElo = (driverElos[winnerId] =
      driverElos?.[winnerId] ?? 1000);

    // 0 = BYE driver
    const loserStartingElo = (driverElos[loserId] =
      loserId === 0 ? 1000 : driverElos?.[loserId] ?? 1000);

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
    if (battle.tournament.name.includes("Final")) {
      winnersK *= 2;
    }

    // Calculate new ELOs
    const { winnerElo, loserElo } = calculateElos(
      winnerStartingElo,
      loserStartingElo,
      winnersK,
      losersK
    );

    // Update driver ELOs
    driverElos[winnerId] = winnerElo;
    driverElos[loserId] = loserElo;

    // Update battle with points
    await prisma.tournamentBattles.update({
      where: { id: battle.id },
      data: {
        winnerElo,
        loserElo,
        winnerStartingElo,
        loserStartingElo,
      },
    });

    const winnerPoints = winnerElo - winnerStartingElo;
    const loserPoints = loserElo - loserStartingElo;

    console.log(
      clc.bgMagenta(
        `Battle ${battle.id}, ${battle.tournament.name} (totalwins: ${winnerTotalBattles}) (${battle.round}):`
      )
    );
    console.log(
      clc.green(
        `   ${winner.user.firstName} ${winner.user.lastName} won ${winnerPoints} points (Total: ${winnerElo.toFixed(3)})`
      )
    );

    console.log(
      clc.red(
        `   ${loser.user.firstName} ${loser.user.lastName} lost ${loserPoints} points (Total: ${loserElo.toFixed(3)})`
      )
    );
  }

  // Update all users with their final ELO scores
  console.log(clc.blue("\nUpdating user ELO scores..."));

  for (const [driverId, elo] of Object.entries(driverElos)) {
    const totalBattles = [...battles].filter((b) => {
      return (
        b.driverLeft?.driverId === parseInt(driverId) ||
        b.driverRight?.driverId === parseInt(driverId)
      );
    }).length;

    await prisma.users.update({
      where: { driverId: parseInt(driverId) },
      data: {
        elo,
        totalBattles,
      },
    });
    console.log(
      clc.blue(`Updated driver ${driverId} with ELO: ${elo.toFixed(3)}`)
    );
  }

  console.log(clc.green("Rating computation complete!"));
};

run().catch((error) => {
  console.error(clc.red("Error computing ratings:"), error);
  process.exit(1);
});
