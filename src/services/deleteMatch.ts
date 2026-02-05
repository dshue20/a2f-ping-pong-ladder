import { doc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import type { Match, Player } from "../types";

/**
 * Deletes a match and reverses all its effects on player stats.
 * This includes: wins, losses, rating changes, and recalculating streaks.
 */
export async function deleteMatch(matchId: string) {
  const matchRef = doc(db, "matches", matchId);
  const matchSnap = await getDoc(matchRef);

  if (!matchSnap.exists()) {
    throw new Error("Match not found");
  }

  const match = matchSnap.data() as Match;

  // Fetch current player data
  const playerARef = doc(db, "players", match.playerAId);
  const playerBRef = doc(db, "players", match.playerBId);

  const snapA = await getDoc(playerARef);
  const snapB = await getDoc(playerBRef);

  if (!snapA.exists() || !snapB.exists()) {
    throw new Error("One or both players not found");
  }

  const playerA = snapA.data() as Player;
  const playerB = snapB.data() as Player;

  // Determine who won and lost in this match
  const playerAWon = match.scoreA > match.scoreB;
  const playerBWon = match.scoreB > match.scoreA;

  // Reverse the rating changes
  const newRatingA = playerA.rating - match.ratingChangeA;
  const newRatingB = playerB.rating - match.ratingChangeB;

  // Reverse wins/losses
  const newWinsA = playerA.wins - (playerAWon ? 1 : 0);
  const newLossesA = playerA.losses - (playerAWon ? 0 : 1);
  const newWinsB = playerB.wins - (playerBWon ? 1 : 0);
  const newLossesB = playerB.losses - (playerBWon ? 0 : 1);

  // Recalculate streaks by going back one result
  // This is tricky - we need to reverse the last streak update
  // For simplicity, we'll recalculate based on the new win/loss state
  // A more robust solution would track match history, but this works for most cases
  const streakA = reverseStreak(playerA.streak, playerAWon);
  const streakB = reverseStreak(playerB.streak, playerBWon);

  // Batch update to ensure atomicity
  const batch = writeBatch(db);

  batch.update(playerARef, {
    rating: newRatingA,
    wins: Math.max(0, newWinsA), // Ensure non-negative
    losses: Math.max(0, newLossesA),
    streak: streakA,
    gamesPlayed: Math.max(0, playerA.gamesPlayed - 1),
  });

  batch.update(playerBRef, {
    rating: newRatingB,
    wins: Math.max(0, newWinsB),
    losses: Math.max(0, newLossesB),
    streak: streakB,
    gamesPlayed: Math.max(0, playerB.gamesPlayed - 1),
  });

  // Delete the match document
  batch.delete(matchRef);

  // Commit all updates
  await batch.commit();
}

/**
 * Reverses a streak by one game.
 * If the streak was "W3" and the last result was a win, it becomes "W2".
 * If the streak was "W1" and the last result was a win, it becomes "" or we try to infer previous.
 */
function reverseStreak(currentStreak: string, wasWin: boolean): string {
  if (!currentStreak || currentStreak === "-") {
    // No streak to reverse
    return "";
  }

  const type = currentStreak[0]; // "W" or "L"
  const count = parseInt(currentStreak.slice(1)) || 0;

  // Check if this streak type matches the result we're reversing
  const streakMatchesResult =
    (type === "W" && wasWin) || (type === "L" && !wasWin);

  if (streakMatchesResult) {
    // Decrement the streak
    if (count <= 1) {
      // Streak goes to empty - we don't know what was before
      return "";
    }
    return type + (count - 1);
  } else {
    // The current streak doesn't match what we're reversing
    // This means the streak was broken by this match
    // We don't know what the previous streak was, so return empty
    return "";
  }
}
