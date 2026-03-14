import clc from "cli-color";
import readline from "readline";
import { prisma } from "~/utils/prisma.server";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question: string): Promise<string> =>
  new Promise((resolve) => rl.question(question, resolve));

const run = async () => {
  const claims = await prisma.profileClaimRequests.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      driver: {
        select: {
          driverId: true,
          firstName: true,
          lastName: true,
        },
      },
      user: {
        select: {
          id: true,
          driverId: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (claims.length === 0) {
    console.log(clc.green("No pending profile claim requests."));
    rl.close();
    return;
  }

  console.log(
    clc.bgBlue(
      `\n Found ${claims.length} pending profile claim request(s):\n`,
    ),
  );

  let approved = 0;
  let denied = 0;

  for (const [i, claim] of claims.entries()) {
    const targetName = `${claim.driver.firstName} ${claim.driver.lastName}`;
    const requesterName = `${claim.user.firstName} ${claim.user.lastName}`;
    const date = claim.createdAt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    console.log(clc.cyan(`\n[${i + 1}/${claims.length}]`));
    console.log(`  Target Profile:   ${targetName} (#${claim.driver.driverId})`);
    console.log(`  Requester:        ${requesterName} (#${claim.user.driverId})`);
    console.log(`  Date:             ${date}`);

    const answer = await ask(clc.yellow("\n  Approve claim? (y/n): "));
    const yes = answer.trim().toLowerCase() === "y";

    if (yes) {
      const targetDriverId = claim.driver.driverId;
      const requesterDriverId = claim.user.driverId;

      await prisma.$transaction([
        prisma.tournamentDrivers.updateMany({
          where: { driverId: targetDriverId },
          data: { driverId: requesterDriverId },
        }),
        prisma.leaderboardDrivers.updateMany({
          where: { driverId: targetDriverId },
          data: { driverId: requesterDriverId },
        }),
        prisma.profileClaimRequests.delete({
          where: { id: claim.id },
        }),
        prisma.users.delete({
          where: { driverId: targetDriverId },
        }),
      ]);

      console.log(
        clc.green(
          `  ✓ Approved — reassigned data from #${targetDriverId} to #${requesterDriverId} and deleted ghost profile`,
        ),
      );
      approved++;
    } else {
      await prisma.profileClaimRequests.delete({
        where: { id: claim.id },
      });
      console.log(clc.red(`  ✗ Declined — claim request removed`));
      denied++;
    }
  }

  console.log(
    clc.bgGreen(`\nDone! Approved: ${approved}, Denied: ${denied}\n`),
  );
  rl.close();
};

run().catch((error) => {
  console.error(clc.red("Error:"), error);
  rl.close();
  process.exit(1);
});
