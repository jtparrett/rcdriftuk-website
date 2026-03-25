import { prisma } from "./prisma.server";
import { tournamentAddDrivers } from "./tournamentAddDrivers";
import { tournamentCreateBattles } from "./tournamentCreateBattles";
import {
  BattlesBracket,
  Regions,
  TournamentsFormat,
  TournamentsState,
} from "./enums";
import { pow2Ceil } from "./powFns";
import { toStageRound } from "./tournamentStageRounds";

export interface ImportDriver {
  parsedName: string;
  firstName: string;
  lastName: string | null;
  parsedDriverId: number | null;
  matchedDriverId: number | null;
  isNew: boolean;
}

export interface ImportBattleEntry {
  driverLeftIndex: number;
  driverRightIndex: number;
  winnerIndex: number | null;
}

export interface ImportTournamentInput {
  name: string;
  userId: string;
  ownerDriverId: number;
  drivers: ImportDriver[];
  battles: ImportBattleEntry[];
  hasPlayoff: boolean;
}

export async function previewDriverMatches(
  entries: {
    name: string;
    firstName: string;
    lastName: string | null;
    parsedDriverId: number | null;
  }[],
): Promise<ImportDriver[]> {
  const allUsers = await prisma.users.findMany({
    where: { archived: false },
    select: { driverId: true, firstName: true, lastName: true },
  });

  const result: ImportDriver[] = [];
  const usedDriverIds = new Set<number>();

  for (const entry of entries) {
    let matchedDriverId: number | null = null;

    if (entry.parsedDriverId) {
      const match = allUsers.find((u) => u.driverId === entry.parsedDriverId);
      if (match && !usedDriverIds.has(match.driverId)) {
        matchedDriverId = match.driverId;
      }
    }

    if (!matchedDriverId) {
      const matches = allUsers.filter((u) => {
        if (usedDriverIds.has(u.driverId)) return false;
        const firstMatch =
          u.firstName?.toLowerCase() === entry.firstName.toLowerCase();
        if (!firstMatch) return false;

        if (entry.lastName) {
          return u.lastName?.toLowerCase() === entry.lastName.toLowerCase();
        }
        return true;
      });

      if (matches.length === 1) {
        matchedDriverId = matches[0].driverId;
      } else if (matches.length > 1) {
        const exact = entry.lastName
          ? matches.find(
              (u) =>
                u.lastName?.toLowerCase() === entry.lastName!.toLowerCase(),
            )
          : matches.find((u) => !u.lastName);
        matchedDriverId = exact ? exact.driverId : matches[0].driverId;
      }
    }

    if (matchedDriverId) {
      usedDriverIds.add(matchedDriverId);
    }

    result.push({
      parsedName: entry.name,
      firstName: entry.firstName,
      lastName: entry.lastName,
      parsedDriverId: entry.parsedDriverId,
      matchedDriverId,
      isNew: matchedDriverId === null,
    });
  }

  return result;
}

async function resolveDriverIds(
  drivers: ImportDriver[],
): Promise<ImportDriver[]> {
  const resolved: ImportDriver[] = [];

  for (const driver of drivers) {
    if (!driver.isNew && driver.matchedDriverId) {
      resolved.push(driver);
    } else {
      const newUser = await prisma.users.create({
        data: {
          firstName: driver.firstName,
          lastName: driver.lastName || null,
        },
      });
      resolved.push({
        ...driver,
        matchedDriverId: newUser.driverId,
      });
    }
  }

  return resolved;
}

/**
 * Computes bracket size from the number of battles and whether a playoff exists.
 * Single elimination: bracketSize - 1 battles without playoff, bracketSize with playoff.
 */
export function computeBracketSize(
  battleCount: number,
  hasPlayoff: boolean,
): number {
  const raw = hasPlayoff ? battleCount : battleCount + 1;
  return pow2Ceil(raw);
}

/**
 * Assigns round numbers to imported battles based on bracket structure.
 * Returns an array of round numbers matching the input battle order.
 *
 * For a Top 8 without playoff (7 battles):
 *   [1, 1, 1, 1, 2, 2, 1000]
 *
 * For a Top 8 with playoff (8 battles):
 *   [1, 1, 1, 1, 2, 2, totalRounds+1, 1000]
 */
export function assignRounds(
  battleCount: number,
  bracketSize: number,
  hasPlayoff: boolean,
): number[] {
  const totalRounds = Math.ceil(Math.log2(bracketSize)) - 1;
  const rounds: number[] = [];

  let battlesInRound = bracketSize / 2;
  let roundNum = 1;
  let assigned = 0;

  while (assigned < battleCount) {
    const remaining = battleCount - assigned;

    if (!hasPlayoff && remaining === 1) {
      rounds.push(1000);
      assigned++;
    } else if (hasPlayoff && remaining === 2) {
      rounds.push(totalRounds + 1);
      rounds.push(1000);
      assigned += 2;
    } else {
      const count = Math.min(battlesInRound, remaining);
      for (let i = 0; i < count; i++) {
        rounds.push(roundNum);
      }
      assigned += count;
      battlesInRound = Math.max(1, Math.floor(battlesInRound / 2));
      roundNum++;
    }
  }

  return rounds;
}

export async function createImportedTournament(
  input: ImportTournamentInput,
): Promise<string> {
  const { name, userId, ownerDriverId, battles, hasPlayoff } = input;

  const drivers = await resolveDriverIds(input.drivers);
  const bracketSize = computeBracketSize(battles.length, hasPlayoff);

  const tournament = await prisma.tournaments.create({
    data: {
      name,
      userId,
      enableQualifying: false,
      bracketSize,
      region: Regions.UK,
    },
  });

  const tournamentId = tournament.id;

  const driverIds = drivers.map((d) => d.matchedDriverId!);
  if (driverIds.length > 0) {
    await tournamentAddDrivers(tournamentId, driverIds);
  }

  const judge = await prisma.tournamentJudges.create({
    data: {
      tournamentId,
      driverId: ownerDriverId,
      points: 100,
      sortOrder: 0,
      alias: "Owner",
    },
  });

  await prisma.tournamentBattleStages.create({
    data: {
      tournamentId,
      name: "Bracket",
      sortOrder: 1,
      bracketSize,
      format: TournamentsFormat.STANDARD,
    },
  });

  await tournamentCreateBattles(tournamentId);

  const firstStage = await prisma.tournamentBattleStages.findFirst({
    where: { tournamentId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });
  const stageOrder = firstStage?.sortOrder ?? 1;
  const toStoredRound = (localRound: number) =>
    toStageRound(stageOrder, localRound);

  // tournamentCreateBattles always creates a playoff for STANDARD format.
  // Remove it when the import doesn't include one.
  if (!hasPlayoff) {
    const totalRounds = Math.ceil(Math.log2(bracketSize)) - 1;
    await prisma.tournamentBattles.deleteMany({
      where: {
        tournamentId,
        round: toStoredRound(totalRounds + 1),
        bracket: BattlesBracket.UPPER,
        ...(firstStage?.id ? { stageId: firstStage.id } : {}),
      },
    });
  }

  // Get tournament drivers in add-order
  const tournamentDrivers = await prisma.tournamentDrivers.findMany({
    where: { tournamentId },
    orderBy: { tournamentDriverNumber: "asc" },
  });

  // Compute which round each imported battle belongs to
  const rounds = assignRounds(battles.length, bracketSize, hasPlayoff);

  // Group DB battles by round so we can fill them in order
  const dbBattles = await prisma.tournamentBattles.findMany({
    where: {
      tournamentId,
      bracket: BattlesBracket.UPPER,
      ...(firstStage?.id ? { stageId: firstStage.id } : {}),
    },
    orderBy: [{ round: "asc" }, { id: "asc" }],
  });

  // Build a map of round -> ordered list of DB battle IDs
  const dbBattlesByRound = new Map<number, number[]>();
  for (const b of dbBattles) {
    const list = dbBattlesByRound.get(b.round) || [];
    list.push(b.id);
    dbBattlesByRound.set(b.round, list);
  }

  // Track how many DB battles we've consumed per round
  const roundCursors = new Map<number, number>();

  for (let i = 0; i < battles.length; i++) {
    const importBattle = battles[i];
    const round = rounds[i]!;
    const storedRound = toStoredRound(round);

    const leftTd = tournamentDrivers[importBattle.driverLeftIndex];
    const rightTd = tournamentDrivers[importBattle.driverRightIndex];
    if (!leftTd || !rightTd) continue;

    const winnerTd =
      importBattle.winnerIndex != null
        ? tournamentDrivers[importBattle.winnerIndex]
        : null;

    // Find the next available DB battle slot for this round
    const slots = dbBattlesByRound.get(storedRound);
    if (!slots) continue;

    const cursor = roundCursors.get(storedRound) || 0;
    const dbBattleId = slots[cursor];
    if (dbBattleId == null) continue;
    roundCursors.set(storedRound, cursor + 1);

    await prisma.tournamentBattles.update({
      where: { id: dbBattleId },
      data: {
        driverLeftId: leftTd.id,
        driverRightId: rightTd.id,
        winnerId: winnerTd?.id ?? null,
      },
    });

    if (winnerTd) {
      await prisma.tournamentBattleVotes.create({
        data: {
          battleId: dbBattleId,
          judgeId: judge.id,
          winnerId: winnerTd.id,
        },
      });
    }
  }

  await prisma.tournaments.update({
    where: { id: tournamentId },
    data: {
      state: TournamentsState.BATTLES,
      nextBattleId: null,
    },
  });

  return tournamentId;
}
