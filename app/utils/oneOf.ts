export const oneOf = <T>(
  value: unknown,
  values: readonly T[]
): T | undefined => {
  return values.find((a) => a === value);
};

export const isOneOf = <T>(
  value: unknown,
  values: readonly T[]
): value is T => {
  return values.find((a) => a === value) !== undefined;
};
