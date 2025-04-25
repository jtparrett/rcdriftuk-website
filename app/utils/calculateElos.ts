export function calculateElos(
  winnerStartingElo: number,
  loserStartingElo: number,
  winnersK: number,
  losersK: number
) {
  const expectedScorePlayer =
    1 / (1 + Math.pow(10, (loserStartingElo - winnerStartingElo) / 400));

  const expectedScoreOpponent = 1 - expectedScorePlayer;

  const winnerElo = winnerStartingElo + winnersK * (1 - expectedScorePlayer);
  const loserElo = loserStartingElo + losersK * (0 - expectedScoreOpponent);

  return { winnerElo, loserElo };
}
