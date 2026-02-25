/**
 * Migration script: Convert existing event ticketing fields to EventTicketTypes.
 *
 * Run AFTER prisma db push (schema must already have EventTicketTypes table).
 *   1. npx prisma db push
 *   2. npx tsx scripts/migrate-ticket-types.ts
 *
 * Safe to run multiple times — skips events that already have ticket types.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Step 1: Delete all CANCELLED tickets globally — they're no longer a valid state
  const deletedCancelled = await prisma.$executeRaw`
    DELETE FROM "EventTickets" WHERE "status" = 'CANCELLED'
  `;
  console.log(`Deleted ${deletedCancelled} cancelled tickets`);

  // Step 2: Delete stale PENDING tickets (no Stripe session, older than 15 minutes)
  const deletedPending = await prisma.$executeRaw`
    DELETE FROM "EventTickets"
    WHERE "status" = 'PENDING'
      AND "sessionId" IS NULL
      AND "updatedAt" < NOW() - INTERVAL '15 minutes'
  `;
  console.log(`Deleted ${deletedPending} stale pending tickets`);

  // Step 3: Migrate events that had ticketing enabled.
  // Include ALL events with tickets (past and future) so that confirmed/refunded
  // tickets from past events keep their ticket type link intact.
  const events: Array<{
    id: string;
    name: string;
    ticketPrice: number;
    ticketReleaseDate: Date;
    allowedRanks: string[];
  }> = await prisma.$queryRaw`
    SELECT id, name, "ticketPrice", "ticketReleaseDate", "allowedRanks"
    FROM "Events"
    WHERE "enableTicketing" = true
      AND "ticketPrice" IS NOT NULL
      AND "ticketReleaseDate" IS NOT NULL
  `;

  console.log(`Found ${events.length} events with ticketing to migrate`);

  for (const event of events) {
    const existing: Array<{ id: number }> = await prisma.$queryRaw`
      SELECT id FROM "EventTicketTypes" WHERE "eventId" = ${event.id}::uuid
    `;

    if (existing.length > 0) {
      console.log(`  Skipping already migrated: ${event.name}`);
      continue;
    }

    const [ticketType]: Array<{ id: number }> = await prisma.$queryRaw`
      INSERT INTO "EventTicketTypes" ("eventId", "name", "price", "releaseDate", "allowedRanks")
      VALUES (${event.id}::uuid, 'General Admission', ${event.ticketPrice}, ${event.ticketReleaseDate}, ${event.allowedRanks})
      RETURNING id
    `;

    // Link CONFIRMED, PENDING, and REFUNDED tickets to the new type.
    // CANCELLED were already deleted above.
    const linked = await prisma.$executeRaw`
      UPDATE "EventTickets" SET "ticketTypeId" = ${ticketType.id}
      WHERE "eventId" = ${event.id}::uuid AND "ticketTypeId" IS NULL
    `;

    console.log(
      `  Migrated: ${event.name} — ticket type #${ticketType.id}, linked ${linked} tickets`,
    );
  }

  // Step 4: Verify no orphaned tickets remain
  const orphaned: Array<{ count: bigint }> = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM "EventTickets"
    WHERE "ticketTypeId" IS NULL
      AND "status" IN ('CONFIRMED', 'PENDING')
  `;
  const orphanCount = Number(orphaned[0]?.count ?? 0);
  if (orphanCount > 0) {
    console.warn(
      `\n⚠️  Warning: ${orphanCount} confirmed/pending tickets have no ticket type.`,
      `These belong to events that didn't have enableTicketing=true.`,
    );
  }

  console.log("\nMigration complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
