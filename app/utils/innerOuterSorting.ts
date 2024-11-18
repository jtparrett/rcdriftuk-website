// Borrowed from: https://github.com/Drarig29/brackets-manager.js/blob/master/src/ordering.ts

export function sortByInnerOuter<T>(array: T[]) {
  if (array.length === 2) return array;

  const size = array.length / 4;

  const innerPart = [
    array.slice(size, 2 * size),
    array.slice(2 * size, 3 * size),
  ]; // [_, X, X, _]
  const outerPart = [array.slice(0, size), array.slice(3 * size, 4 * size)]; // [X, _, _, X]

  const methods = {
    inner(part: T[][]): T[] {
      return [part[0].pop()!, part[1].shift()!];
    },
    outer(part: T[][]): T[] {
      return [part[0].shift()!, part[1].pop()!];
    },
  };

  const result: T[] = [];

  /**
   * Adds a part (inner or outer) of a part.
   *
   * @param part The part to process.
   * @param method The method to use.
   */
  function add(part: T[][], method: "inner" | "outer"): void {
    if (part[0].length > 0 && part[1].length > 0)
      result.push(...methods[method](part));
  }

  for (let i = 0; i < size / 2; i++) {
    add(outerPart, "outer"); // Outer part's outer
    add(innerPart, "inner"); // Inner part's inner
    add(outerPart, "inner"); // Outer part's inner
    add(innerPart, "outer"); // Inner part's outer
  }

  return result;
}
