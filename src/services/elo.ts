// src/services/elo.ts
export function calculateEloMargin(
  winnerRating: number,
  loserRating: number,
  winnerScore: number,
  loserScore: number,
  targetScore = 21,
  K = 8,
  maxChange = 30
): { newWinnerRating: number; newLoserRating: number; ratingChange: number } {
  const pointDifferential = Math.min(winnerScore - loserScore, targetScore);
  const expected = 1 / (1 + 10 ** ((loserRating - winnerRating) / 400));
  const rawChange = K * pointDifferential * (11 / targetScore) * (1 - expected);
  const change = Math.min(rawChange, maxChange);

  return {
    newWinnerRating: winnerRating + change,
    newLoserRating: loserRating - change,
    ratingChange: change,
  };
}
