import type { Prisma } from "@prisma/client";

export const DEFAULT_POSITION_POINTS: Record<number, number> = {
  1: 10,
  2: 8,
  3: 7,
  4: 6,
  5: 5,
  6: 4.5,
  7: 4,
  8: 3.5,
  9: 3,
  10: 3,
  11: 3,
  12: 3,
  13: 3,
  14: 3,
  15: 3,
  16: 3,
  17: 2,
  18: 2,
  19: 2,
  20: 2,
  21: 2,
  22: 2,
  23: 2,
  24: 2,
  25: 2,
  26: 2,
  27: 2,
  28: 2,
  29: 2,
  30: 2,
  31: 2,
  32: 2,
};

export function getPositionPoints(
  positionPoints: Prisma.JsonValue | null | undefined,
): Record<number, number> {
  if (
    positionPoints &&
    typeof positionPoints === "object" &&
    !Array.isArray(positionPoints)
  ) {
    const result: Record<number, number> = {};
    for (const [key, value] of Object.entries(positionPoints)) {
      const pos = Number(key);
      const pts = Number(value);
      if (pos >= 1 && pos <= 32 && pts >= 0 && pts <= 100) {
        result[pos] = pts;
      }
    }
    if (Object.keys(result).length > 0) return result;
  }
  return DEFAULT_POSITION_POINTS;
}
