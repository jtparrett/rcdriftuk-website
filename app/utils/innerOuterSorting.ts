// Proper recursive algorithm for tournament bracket seeding
// Ensures that the top two seeds are always in opposite halves of the bracket,
// regardless of bracket size (works for 8, 16, 32, 64, 128+ drivers)

export function sortByInnerOuter<T>(array: T[]): T[] {
  if (array.length === 1) return array;
  if (array.length === 2) return array;

  // Recursive approach: generate the bracket order indices
  function generateBracketOrder(numMatchups: number): number[] {
    if (numMatchups === 1) return [0];
    if (numMatchups === 2) return [0, 1];

    const half = numMatchups / 2;
    const top = generateBracketOrder(half);
    const bottom = generateBracketOrder(half);

    const result: number[] = [];
    for (let i = 0; i < half; i++) {
      result.push(top[i]);
      result.push(numMatchups - 1 - bottom[i]);
    }

    return result;
  }

  const order = generateBracketOrder(array.length);
  return order.map((i) => array[i]);
}
