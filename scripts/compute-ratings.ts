import clc from "cli-color";
import { getDriverRatings } from "~/utils/getDriverRatings";
import { prisma } from "~/utils/prisma.server";

function calculateElos(
  ratingPlayer: number,
  ratingOpponent: number,
  winnersK: number,
  losersK: number
) {
  const expectedScorePlayer =
    1 / (1 + Math.pow(10, (ratingOpponent - ratingPlayer) / 400));

  const expectedScoreOpponent = 1 - expectedScorePlayer;

  const newRatingPlayer = ratingPlayer + winnersK * (1 - expectedScorePlayer);
  const newRatingOpponent =
    ratingOpponent + losersK * (0 - expectedScoreOpponent);

  return { newRatingPlayer, newRatingOpponent };
}

const run = async () => {
  console.log(clc.green("Computing ratings..."));

  // Get all battles ordered by creation date
  const battles = await prisma.tournamentBattles.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    where: {
      tournamentId: {
        in: [
          "a3584bc1-dc83-4244-ab51-e2314cf2ca03", // 2024-RND1
          "00dbd997-5582-452e-8b71-f38c2cef4137", // 2024-RND2
          "0b0d0bbb-f9ca-4901-8435-28a3131197a7", // 2024-RND3
          "71e86597-22d1-4de2-aae0-da65308d233a", // 2024-RND4
          "d0d9875c-e10e-47af-a184-f4ac47660593", // 2024-RND5
          "24fdae55-c97d-40c2-924f-aab962108b1d", // 2024-RND6
          "35788ae3-9cd2-46e4-b295-1bb26cbeec25", // 2024-FINAL

          // 2025
          "6a3f3210-b871-46bb-bb95-a13b78851c63",
          "4b47a904-bd88-4d37-b3f7-c6093e8cbb26",
          "bcb1a684-e0d4-4b88-9c44-1172572c27ae",
        ],
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

  const uniqueDrivers: Record<number, any> = {};
  for (const battle of battles) {
    if (battle.driverLeftId !== null) {
      uniqueDrivers[battle.driverLeftId] = battle.driverLeft;
    }
    if (battle.driverRightId !== null) {
      uniqueDrivers[battle.driverRightId] = battle.driverRight;
    }
  }
  const uniqueDriverIds = new Set();
  const uniqueDriversList = Object.values(uniqueDrivers).filter((driver) => {
    if (uniqueDriverIds.has(driver.driverId)) {
      return false;
    }
    uniqueDriverIds.add(driver.driverId);
    return true;
  });

  console.log(
    clc.bgYellow(`
    DRIVERS
    ${uniqueDriversList
      .map((d) => `${d.user.firstName} ${d.user.lastName} (${d.driverId})`)
      .sort((a, b) => a.localeCompare(b))
      .join("\n")}
    `)
  );

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

    const loserStartingElo = (driverElos[loserId] =
      loserId === 0 ? 1000 : driverElos?.[loserId] ?? 1000);

    // Count previous battles for K-factor calculation
    const winnerTotalBattles = Math.max(
      [...battles].slice(0, index).filter((b) => {
        return (
          b.driverLeft?.driverId === winnerId ||
          b.driverRight?.driverId === winnerId
        );
      }).length,
      0
    );

    // Calculate K-factor
    let winnersK = winnerTotalBattles >= 5 ? 32 : 64;
    const losersK = 32;

    // Increase K-factor for tournament finals
    if (battle.tournament.name.includes("Final")) {
      console.log(clc.bgGreen(`Final tournament`));
      winnersK *= 2;
    }

    // Calculate new ELOs
    const { newRatingPlayer: winnerElo, newRatingOpponent: loserElo } =
      calculateElos(winnerStartingElo, loserStartingElo, winnersK, losersK);

    // Update driver ELOs
    driverElos[winnerId] = winnerElo;
    driverElos[loserId] = loserElo;

    // Update battle with points
    // await prisma.tournamentBattles.update({
    //   where: { id: battle.id },
    //   data: {
    //     winnerElo,
    //     loserElo,
    //   },
    // });

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

  console.log(clc.green("Rating computation complete!"));

  // Sort and log final driver rankings
  const sortedDrivers = Object.entries(driverElos)
    .sort(([, a], [, b]) => b - a)
    .map(([id, elo], index) => ({
      position: index + 1,
      id,
      elo,
    }));

  console.log("\nFinal Driver Rankings:");
  console.log("----------------------");

  for (const { position, id, elo } of sortedDrivers) {
    const battle = battles.find(
      (b) =>
        b.driverRight?.user.driverId === Number(id) ||
        b.driverLeft?.user.driverId === Number(id)
    );
    const name =
      battle?.driverLeft?.user.driverId === Number(id)
        ? battle?.driverLeft?.user.firstName +
          " " +
          battle?.driverLeft?.user.lastName
        : battle?.driverRight?.user.firstName +
          " " +
          battle?.driverRight?.user.lastName;

    console.log(
      clc.cyan(
        `${position.toString().padStart(2)}. ${name.padEnd(30)} ${elo.toFixed(3)} points`
      )
    );
  }

  const existingRatings = await getDriverRatings();

  console.log(
    clc.blue(`Found ${existingRatings.length} existing ratings to process`)
  );

  existingRatings.forEach((rating, i) => {
    console.log(
      clc.cyan(
        `${i + 1}. ${(rating.firstName + " " + rating.lastName).padEnd(30)} ${rating.currentElo.toFixed(3)} points`
      )
    );
  });

  console.log("\nRating Changes:");
  console.log("---------------");

  for (const { id, elo } of sortedDrivers) {
    if (id === "0") continue;

    const oldRating = existingRatings.find((r) => r.driverId === Number(id));
    if (!oldRating) continue;

    const difference = elo - oldRating.currentElo;
    const arrow = difference === 0 ? "=" : difference > 0 ? "↑" : "↓";
    const color =
      difference === 0 ? clc.white : difference > 0 ? clc.green : clc.red;

    console.log(
      color(
        `${(oldRating.firstName + " " + oldRating.lastName).padEnd(30)} ${Math.abs(
          difference
        ).toFixed(3)} points ${arrow}`
      )
    );
  }

  console.log("\nMissing Drivers:");
  console.log("---------------");

  // Find drivers in new ratings but not in existing
  for (const { id } of sortedDrivers) {
    if (id === "0") continue;
    if (!existingRatings.find((r) => r.driverId === Number(id))) {
      console.log(clc.yellow(`${id} - New driver, not in existing ratings`));
    }
  }

  // Find drivers in existing ratings but not in new
  for (const rating of existingRatings) {
    if (!sortedDrivers.find((d) => d.id === rating.driverId.toString())) {
      console.log(
        clc.yellow(
          `${rating.driverId} - In existing ratings but not in new list`
        )
      );
    }
  }

  console.log("\nBattle Differences:");
  console.log("------------------");

  const existingBattles = await prisma.driverRatingBattles.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      winnerId: true,
      loserId: true,
      tournament: true,
      createdAt: true,
    },
  });

  // Compare battles by driver IDs and winner
  for (const battle of battles) {
    // Skip battles without a winner
    if (battle.winnerId === null) continue;

    // Determine the winner and loser driver IDs
    const winnerDriverId =
      battle.winnerId === battle.driverLeftId
        ? battle.driverLeft?.user.driverId
        : battle.driverRight?.user.driverId;

    const loserDriverId =
      battle.winnerId === battle.driverLeftId
        ? battle.driverRight?.user.driverId
        : battle.driverLeft?.user.driverId;

    // Skip if we can't determine the drivers
    if (winnerDriverId === undefined || loserDriverId === undefined) continue;

    // Find matching battle in existing battles
    const existingBattle = existingBattles.find(
      (b) => b.winnerId === winnerDriverId && b.loserId === loserDriverId
    );

    if (!existingBattle) {
      console.log(
        clc.yellow(
          `Battle with drivers ${winnerDriverId} vs ${loserDriverId} (winner: ${winnerDriverId}) exists in new data but not in database`
        )
      );
      continue;
    }
  }

  // Check for battles in DB that aren't in new data
  for (const existingBattle of existingBattles) {
    // Find matching battle in new battles
    const matchingBattle = battles.find((b) => {
      if (b.winnerId === null) return false;

      const winnerDriverId =
        b.winnerId === b.driverLeftId
          ? b.driverLeft?.user.driverId
          : b.driverRight?.user.driverId;

      const loserDriverId =
        b.winnerId === b.driverLeftId
          ? b.driverRight?.user.driverId
          : b.driverLeft?.user.driverId;

      return (
        winnerDriverId === existingBattle.winnerId &&
        loserDriverId === existingBattle.loserId
      );
    });

    if (!matchingBattle) {
      console.log(
        clc.yellow(
          `Battle with drivers ${existingBattle.winnerId} vs ${existingBattle.loserId} (winner: ${existingBattle.winnerId}) exists in database but not in new data`
        )
      );
    }
  }
};

run().catch((error) => {
  console.error(clc.red("Error computing ratings:"), error);
  process.exit(1);
});
