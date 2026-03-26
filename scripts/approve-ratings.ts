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
  const tournaments = await prisma.tournaments.findMany({
    where: {
      ratingRequested: true,
      rated: false,
      state: "END",
      archived: false,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      region: true,
      createdAt: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          drivers: true,
          battles: true,
        },
      },
    },
  });

  if (tournaments.length === 0) {
    console.log(clc.green("No tournaments pending rating approval."));
    rl.close();
    return;
  }

  console.log(
    clc.bgBlue(
      `\n Found ${tournaments.length} tournament(s) pending rating approval:\n`,
    ),
  );

  let approved = 0;
  let denied = 0;

  for (const [i, t] of tournaments.entries()) {
    const creator = t.user
      ? `${t.user.firstName} ${t.user.lastName}`
      : "Unknown";
    const date = t.createdAt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    console.log(clc.cyan(`\n[${i + 1}/${tournaments.length}] ${t.name}`));
    console.log(`  Region:   ${t.region ?? "None"}`);
    console.log(`  Date:     ${date}`);
    console.log(`  Creator:  ${creator}`);
    console.log(`  Drivers:  ${t._count.drivers}`);
    console.log(`  Battles:  ${t._count.battles}`);

    const answer = await ask(clc.yellow("\n  Approve rating? (y/n): "));
    const yes = answer.trim().toLowerCase() === "y";

    if (yes) {
      await prisma.tournaments.update({
        where: { id: t.id },
        data: { rated: true },
      });
      console.log(clc.green(`  ✓ Marked as rated`));
      approved++;
    } else {
      await prisma.tournaments.update({
        where: { id: t.id },
        data: { ratingRequested: false },
      });
      console.log(clc.red(`  ✗ Rating request removed`));
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
