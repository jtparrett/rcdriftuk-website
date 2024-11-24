import { PrismaClient } from "@prisma/client";

declare global {
  var __db: PrismaClient | undefined;
}

// Only create a new PrismaClient if one doesn't already exist
if (!global.__db) {
  global.__db = new PrismaClient();
}

const prisma = global.__db;

export { prisma };
