export const pow2Floor = (value: number) => {
  const l = Math.log2(value);
  return 0x1 << l;
};

export const pow2Ceil = (n: number): number => {
  if (n <= 0) return 1;

  if (pow2Floor(n) === n) return n; // Already a power of 2

  return pow2Floor(n * 2);
};
