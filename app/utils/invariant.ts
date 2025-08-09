export default function invariant(
  condition: any,
  message: string,
): asserts condition {
  if (condition) {
    return;
  }

  const value = `Invariant failed: ${message}`;

  console.log("Invariant", value);

  throw new Error(value);
}
