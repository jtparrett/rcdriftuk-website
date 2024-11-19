export const nameStringToArray = (value: string) =>
  value
    .replaceAll(", ", ",")
    .split(",")
    .filter((name) => !!name);
