import { BattlesBracket } from "@prisma/client";
import { prisma } from "~/utils/prisma.server";

export const pow2Ceil = (value: number) => {
  return pow2Floor(value * 2);
};

export const pow2Floor = (value: number) => {
  const l = Math.log2(value);
  return 0x1 << l;
};

interface Params {
  tournamentId: string;
  battleId: number;
  winnerId: number;
}

export const advanceSingleEliminationBattleWinner = async ({
  tournamentId,
  battleId,
  winnerId,
}: Params) => {
  const thisBattle = await prisma.tournamentBattles.update({
    where: {
      id: battleId,
    },
    data: {
      winnerId,
    },
  });

  const emptyBattles = await prisma.tournamentBattles.findMany({
    where: {
      tournamentId,
      OR: [
        {
          driverLeftId: null,
        },
        {
          driverRightId: null,
        },
      ],
    },
    orderBy: [
      { round: "asc" },
      { bracket: "asc" },
      {
        id: "asc",
      },
    ],
  });

  const queries = [];

  // Split into 3rd/4th and 1st/2nd battles
  if (emptyBattles.length === 2) {
    const finalB = emptyBattles[0];
    const finalA = emptyBattles[1];
    const thisLoserId =
      thisBattle.driverLeftId === winnerId
        ? thisBattle.driverRightId
        : thisBattle.driverLeftId;

    // Update left side of final battles
    if (finalB.driverLeftId === null) {
      queries.push(
        prisma.tournamentBattles.update({
          where: {
            id: finalB.id,
          },
          data: {
            driverLeftId: thisLoserId,
          },
        })
      );

      queries.push(
        prisma.tournamentBattles.update({
          where: {
            id: finalA.id,
          },
          data: {
            driverLeftId: winnerId,
          },
        })
      );

      await prisma.$transaction(queries);

      return null;
    }

    // Update right side of final battles
    if (finalB.driverRightId === null) {
      queries.push(
        prisma.tournamentBattles.update({
          where: {
            id: finalB.id,
          },
          data: {
            driverRightId: thisLoserId,
          },
        })
      );

      queries.push(
        prisma.tournamentBattles.update({
          where: {
            id: finalA.id,
          },
          data: {
            driverRightId: winnerId,
          },
        })
      );
    }

    await prisma.$transaction(queries);

    return null;
  }

  // If no nextBattle, then we're at end of comp

  const nextBattle = emptyBattles?.[0];

  if (nextBattle) {
    const emptySide =
      nextBattle?.driverLeftId === null ? "driverLeftId" : "driverRightId";

    queries.push(
      prisma.tournamentBattles.update({
        where: {
          id: nextBattle.id,
        },
        data: {
          [emptySide]: winnerId,
        },
      })
    );

    await prisma.$transaction(queries);

    return null;
  }
};

export const advanceDoubleEliminationBattleWinner = async ({
  tournamentId,
  battleId,
  winnerId,
}: Params) => {
  const thisBattle = await prisma.tournamentBattles.update({
    where: {
      id: battleId,
    },
    data: {
      winnerId,
    },
  });

  // Split drivers for first round into winners and losers
  if (thisBattle.round === 1 && thisBattle.bracket === BattlesBracket.UPPER) {
    const nextEmptyWinnersBattle = await prisma.tournamentBattles.findFirst({
      where: {
        tournamentId,
        winnerId: null,
        round: 2,
        bracket: BattlesBracket.UPPER,
        OR: [
          {
            driverLeftId: null,
          },
          {
            driverRightId: null,
          },
        ],
      },
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        driverLeftId: true,
      },
    });

    if (nextEmptyWinnersBattle) {
      const emptySide =
        nextEmptyWinnersBattle?.driverLeftId === null
          ? "driverLeftId"
          : "driverRightId";

      await prisma.tournamentBattles.update({
        where: {
          id: nextEmptyWinnersBattle.id,
        },
        data: {
          [emptySide]: winnerId,
        },
      });
    }

    const nextEmptyLosersBattle = await prisma.tournamentBattles.findFirst({
      where: {
        tournamentId,
        winnerId: null,
        round: 1,
        bracket: BattlesBracket.LOWER,
        OR: [
          {
            driverLeftId: null,
          },
          {
            driverRightId: null,
          },
        ],
      },
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        driverLeftId: true,
      },
    });

    if (nextEmptyLosersBattle) {
      const emptySide =
        nextEmptyLosersBattle?.driverLeftId === null
          ? "driverLeftId"
          : "driverRightId";

      const loserId =
        winnerId === thisBattle.driverLeftId
          ? thisBattle.driverRightId
          : thisBattle.driverLeftId;

      await prisma.tournamentBattles.update({
        where: {
          id: nextEmptyLosersBattle.id,
        },
        data: {
          [emptySide]: loserId,
        },
      });
    }

    return null;
  }

  // Update winners battle
  if (thisBattle.bracket === BattlesBracket.UPPER) {
    const nextEmptyLosersBattle = await prisma.tournamentBattles.findFirst({
      where: {
        tournamentId,
        bracket: BattlesBracket.LOWER,
        OR: [
          {
            driverLeftId: null,
          },
          {
            driverRightId: null,
          },
        ],
      },
      orderBy: [
        {
          round: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

    // Put the loser in the next empty losers battle
    if (nextEmptyLosersBattle) {
      const emptySide =
        nextEmptyLosersBattle?.driverLeftId === null
          ? "driverLeftId"
          : "driverRightId";

      const loserId =
        winnerId === thisBattle.driverLeftId
          ? thisBattle.driverRightId
          : thisBattle.driverLeftId;

      await prisma.tournamentBattles.update({
        where: {
          id: nextEmptyLosersBattle.id,
        },
        data: {
          [emptySide]: loserId,
        },
      });
    }

    const nextEmptyWinnersBattle = await prisma.tournamentBattles.findFirst({
      where: {
        tournamentId,
        bracket: BattlesBracket.UPPER,
        OR: [
          {
            driverLeftId: null,
          },
          {
            driverRightId: null,
          },
        ],
      },
      orderBy: [
        {
          round: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

    // Put the winner in the next empty winners battle
    if (nextEmptyWinnersBattle) {
      const emptySide =
        nextEmptyWinnersBattle?.driverLeftId === null
          ? "driverLeftId"
          : "driverRightId";

      await prisma.tournamentBattles.update({
        where: {
          id: nextEmptyWinnersBattle.id,
        },
        data: {
          [emptySide]: winnerId,
        },
      });
    }

    return null;
  }

  // Update loser battle
  // Put winner into next losers round (left only)
  if (thisBattle.bracket === BattlesBracket.LOWER) {
    const nextEmptyLosersBattleSameRound =
      await prisma.tournamentBattles.findFirst({
        where: {
          tournamentId,
          winnerId: null,
          bracket: BattlesBracket.LOWER,
          round: thisBattle.round,
          OR: [
            {
              driverLeftId: null,
            },
            {
              driverRightId: null,
            },
          ],
        },
        orderBy: [
          {
            round: "asc",
          },
          {
            id: "asc",
          },
        ],
        select: {
          id: true,
          driverLeftId: true,
        },
      });

    // Update loser battles in the same round
    if (nextEmptyLosersBattleSameRound) {
      const emptySide =
        nextEmptyLosersBattleSameRound?.driverLeftId === null
          ? "driverLeftId"
          : "driverRightId";

      await prisma.tournamentBattles.update({
        where: {
          id: nextEmptyLosersBattleSameRound.id,
        },
        data: {
          [emptySide]: winnerId,
        },
      });

      return null;
    }

    const nextEmptyLosersBattle = await prisma.tournamentBattles.findFirst({
      where: {
        tournamentId,
        winnerId: null,
        bracket: BattlesBracket.LOWER,
        driverLeftId: null,
      },
      orderBy: [
        {
          round: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

    if (nextEmptyLosersBattle) {
      await prisma.tournamentBattles.update({
        where: {
          id: nextEmptyLosersBattle.id,
        },
        data: {
          driverLeftId: winnerId,
        },
      });

      // Do nothing with the loser

      return null;
    }

    // If there's no loser battles left
    // Then put the winner into the final winners battle

    const nextEmptyWinnersBattle = await prisma.tournamentBattles.findFirst({
      where: {
        tournamentId,
        bracket: BattlesBracket.UPPER,
        OR: [
          {
            driverLeftId: null,
          },
          {
            driverRightId: null,
          },
        ],
      },
    });

    if (nextEmptyWinnersBattle) {
      const emptySide =
        nextEmptyWinnersBattle?.driverLeftId === null
          ? "driverLeftId"
          : "driverRightId";

      await prisma.tournamentBattles.update({
        where: {
          id: nextEmptyWinnersBattle.id,
        },
        data: {
          [emptySide]: winnerId,
        },
      });

      return null;
    }

    return null;
  }
};
