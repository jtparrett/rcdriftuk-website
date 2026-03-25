/**
 * Idempotent backfill: one TournamentBattleStages row per tournament + stageId on all battles.
 * Run after `npx prisma db push` with DATABASE_URL set:
 *   pnpm run backfill:battle-stages
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tournaments = await prisma.tournaments.findMany({
    select: { id: true, bracketSize: true, format: true },
  });

  let stagesCreated = 0;
  let battlesUpdated = 0;
  let tournamentsSkipped = 0;

  for (const t of tournaments) {
    const existingStages = await prisma.tournamentBattleStages.findMany({
      where: { tournamentId: t.id },
      orderBy: { sortOrder: "asc" },
    });

    let stageId: string;

    if (existingStages.length > 0) {
      tournamentsSkipped++;
      stageId = existingStages[0]!.id;
    } else {
      const battleCount = await prisma.tournamentBattles.count({
        where: { tournamentId: t.id },
      });
      if (battleCount === 0) {
        continue;
      }
      const stage = await prisma.tournamentBattleStages.create({
        data: {
          tournamentId: t.id,
          name: "Bracket",
          sortOrder: 1,
          bracketSize: t.bracketSize,
          format: t.format,
        },
      });
      stageId = stage.id;
      stagesCreated++;
    }

    const res = await prisma.tournamentBattles.updateMany({
      where: { tournamentId: t.id, stageId: null },
      data: { stageId },
    });
    battlesUpdated += res.count;
  }

  console.log(
    [
      `Tournaments processed: ${tournaments.length}`,
      `Stages created: ${stagesCreated}`,
      `Tournaments that already had stages: ${tournamentsSkipped}`,
      `Battles updated (null stageId): ${battlesUpdated}`,
    ].join("\n"),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
