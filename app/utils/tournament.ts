export const pow2Ceil = (value: number) => {
  return pow2Floor(value * 2);
};

export const pow2Floor = (value: number) => {
  const l = Math.log2(value);
  return 0x1 << l;
};
