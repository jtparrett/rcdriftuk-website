/**
 * Migration script: Convert existing event ticketing fields to EventTicketTypes.
 *
 * RUN THIS BEFORE removing the old columns from the database.
 * Order of operations:
 *   1. Run this script:  npx tsx scripts/migrate-ticket-types.ts
 *   2. Then apply schema: npx prisma db push
 *
 * Safe to run multiple times — skips events that already have ticket types.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Step 1: Create EventTicketTypes table if it doesn't exist
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "EventTicketTypes" (
      "id" SERIAL PRIMARY KEY,
      "eventId" UUID NOT NULL REFERENCES "Events"("id") ON DELETE CASCADE,
      "name" TEXT NOT NULL,
      "price" DOUBLE PRECISION NOT NULL,
      "releaseDate" TIMESTAMP(3) NOT NULL,
      "allowedRanks" TEXT[] DEFAULT '{}',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
    )
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "EventTicketTypes_eventId_idx" ON "EventTicketTypes"("eventId")
  `;

  await prisma.$executeRaw`
    ALTER TABLE "EventTickets"
    ADD COLUMN IF NOT EXISTS "ticketTypeId" INTEGER REFERENCES "EventTicketTypes"("id")
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "EventTickets_ticketTypeId_idx" ON "EventTickets"("ticketTypeId")
  `;

  // Step 2: Delete all CANCELLED tickets globally — they're no longer a valid state
  const deletedCancelled = await prisma.$executeRaw`
    DELETE FROM "EventTickets" WHERE "status" = 'CANCELLED'
  `;
  console.log(`Deleted ${deletedCancelled} cancelled tickets`);

  // Step 3: Delete stale PENDING tickets (no payment, older than 15 minutes)
  const deletedPending = await prisma.$executeRaw`
    DELETE FROM "EventTickets"
    WHERE "status" = 'PENDING'
      AND "sessionId" IS NULL
      AND "updatedAt" < NOW() - INTERVAL '15 minutes'
  `;
  console.log(`Deleted ${deletedPending} stale pending tickets`);

  // Step 4: Migrate events that had ticketing enabled.
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

  // Step 5: Verify no orphaned tickets remain (tickets without a ticket type
  // that belong to an event that was migrated)
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
