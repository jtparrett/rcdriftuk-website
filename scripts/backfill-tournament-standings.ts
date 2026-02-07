import { TournamentsState } from "~/utils/enums";
import { prisma } from "~/utils/prisma.server";
import { setTournamentFinishingPositions } from "~/utils/setTournamentFinishingPositions";

const run = async () => {
  const tournaments = await prisma.tournaments.findMany({
    where: {
      state: TournamentsState.END,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(`Found ${tournaments.length} tournaments to backfill`);

  for (const tournament of tournaments) {
    console.log(`Backfilling standings for ${tournament.id}`);
    await setTournamentFinishingPositions(tournament.id);
    console.log(`Standings backfilled for ${tournament.id}`);
  }
};

run();
