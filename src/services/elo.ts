export function calculateEloMargin(
  winnerRating: number,
  loserRating: number,
  winnerScore: number,
  loserScore: number,
  targetScore = 21,
  K = 10, // Reduced from 12 for more modest close games
  maxChange = 20,
): { newWinnerRating: number; newLoserRating: number; ratingChange: number } {
  // Calculate expected probability (opponent strength component)
  const expected = 1 / (1 + 10 ** ((loserRating - winnerRating) / 400));

  // Point differential component - moderate dampening
  // Using a gentler curve: linear * 0.7 + sqrt * 0.3 to balance blowout dampening
  const pointDifferential = Math.min(winnerScore - loserScore, targetScore);
  const normalizedDiff = pointDifferential / targetScore;
  const marginMultiplier =
    1 + (normalizedDiff * 0.7 + Math.sqrt(normalizedDiff) * 0.3) * 1.8;

  // Calculate rating change
  const rawChange = K * marginMultiplier * (1 - expected);
  const change = Math.min(rawChange, maxChange);

  return {
    newWinnerRating: winnerRating + change,
    newLoserRating: loserRating - change,
    ratingChange: change,
  };
}
