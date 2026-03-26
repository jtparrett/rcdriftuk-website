import { prisma } from "~/utils/prisma.server";

const run = async () => {
  const tournaments = await prisma.tournaments.findMany({
    select: {
      id: true,
      format: true,
      bracketSize: true,
      brackets: { select: { id: true } },
    },
  });

  console.log(`Found ${tournaments.length} tournaments`);

  let migrated = 0;

  for (const tournament of tournaments) {
    if (tournament.brackets.length > 0) {
      console.log(`Skipping ${tournament.id} - already has brackets`);
      continue;
    }

    const bracket = await prisma.tournamentBrackets.create({
      data: {
        tournamentId: tournament.id,
        name: "Main",
        bracketSize: tournament.bracketSize,
        format: tournament.format,
      },
    });

    await prisma.tournamentBattles.updateMany({
      where: {
        tournamentId: tournament.id,
        tournamentBracketId: null,
      },
      data: {
        tournamentBracketId: bracket.id,
      },
    });

    migrated++;
    console.log(
      `Migrated ${tournament.id} -> bracket ${bracket.id} (${tournament.format}, Top ${tournament.bracketSize})`,
    );
  }

  console.log(`Done. Migrated ${migrated} tournaments.`);
};

run();
