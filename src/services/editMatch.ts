import { deleteMatch } from "./deleteMatch";
import { submitMatch } from "./submitMatch";

/**
 * Edits an existing match by:
 * 1. Deleting the old match (reversing all its effects)
 * 2. Submitting a new match with the updated data
 *
 * This approach ensures all calculations (ELO, streaks, etc.) are correct.
 */
export async function editMatch(
  matchId: string,
  newPlayerAId: string,
  newPlayerBId: string,
  newScoreA: number,
  newScoreB: number,
) {
  // First, delete the old match to reverse its effects
  await deleteMatch(matchId);

  // Then submit the new match with updated data
  await submitMatch({
    playerAId: newPlayerAId,
    playerBId: newPlayerBId,
    scoreA: newScoreA,
    scoreB: newScoreB,
  });
}
