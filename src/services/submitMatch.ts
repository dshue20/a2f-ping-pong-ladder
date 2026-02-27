import {
  collection,
  doc,
  getDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Match, Player } from "../types";
import { calculateEloMargin } from "./elo";

interface SubmitMatchParams {
  playerAId: string;
  playerBId: string;
  scoreA: number;
  scoreB: number;
  targetScore?: number; // default = 21
}

export function updateStreak(player: Player, didWin: boolean) {
  const currentStreak = player.streak; // e.g. "W3", "L2", or ""
  let newStreak = "";

  if (!currentStreak) {
    newStreak = didWin ? "W1" : "L1";
  } else {
    const type = currentStreak[0]; // "W" or "L"
    const count = parseInt(currentStreak.slice(1)) || 0;

    if ((didWin && type === "W") || (!didWin && type === "L")) {
      newStreak = type + (count + 1); // continue streak
    } else {
      newStreak = didWin ? "W1" : "L1"; // reset streak type
    }
  }

  return newStreak;
}

export async function submitMatch({
  playerAId,
  playerBId,
  scoreA,
  scoreB,
  targetScore = 21,
}: SubmitMatchParams) {
  if (playerAId === playerBId)
    throw new Error("A player cannot play against themselves");
  if (scoreA === scoreB) throw new Error("Match cannot end in a tie");

  const playerARef = doc(db, "players", playerAId);
  const playerBRef = doc(db, "players", playerBId);

  // Fetch current player data
  const snapA = await getDoc(playerARef);
  const snapB = await getDoc(playerBRef);

  if (!snapA.exists() || !snapB.exists())
    throw new Error("One or both players not found");

  const playerA = snapA.data() as Player;
  const playerB = snapB.data() as Player;

  // Determine winner and loser
  const winnerId = scoreA > scoreB ? playerAId : playerBId;
  const loserId = winnerId === playerAId ? playerBId : playerAId;

  // Calculate new Elo ratings using the external formula
  const { newWinnerRating, newLoserRating, ratingChange } =
    winnerId === playerAId
      ? calculateEloMargin(
          playerA.rating,
          playerB.rating,
          scoreA,
          scoreB,
          targetScore,
        )
      : calculateEloMargin(
          playerB.rating,
          playerA.rating,
          scoreB,
          scoreA,
          targetScore,
        );

  // Map back to players
  const newRatingA = winnerId === playerAId ? newWinnerRating : newLoserRating;
  const newRatingB = winnerId === playerBId ? newWinnerRating : newLoserRating;

  // Update streaks for each player
  const streakA = updateStreak(playerA, scoreA > scoreB);
  const streakB = updateStreak(playerB, scoreB > scoreA);

  // Batch update to ensure atomicity
  const batch = writeBatch(db);

  batch.update(playerARef, {
    rating: newRatingA,
    wins: playerA.wins + (scoreA > scoreB ? 1 : 0),
    losses: playerA.losses + (scoreA < scoreB ? 1 : 0),
    streak: streakA,
    gamesPlayed: playerA.gamesPlayed + 1,
  });

  batch.update(playerBRef, {
    rating: newRatingB,
    wins: playerB.wins + (scoreB > scoreA ? 1 : 0),
    losses: playerB.losses + (scoreB < scoreA ? 1 : 0),
    streak: streakB,
    gamesPlayed: playerB.gamesPlayed + 1,
  });

  // Add match document
  const matchRef = doc(collection(db, "matches"));
  const matchData: Match = {
    id: matchRef.id,

    playerAId,
    playerAName: playerA.name,

    playerBId,
    playerBName: playerB.name,

    scoreA,
    scoreB,

    winnerId,
    loserId,

    ratingChangeA: newRatingA - playerA.rating,
    ratingChangeB: newRatingB - playerB.rating,

    createdAt: Timestamp.now(),
  };

  batch.set(matchRef, matchData);

  // Commit all updates
  await batch.commit();

  // Return match result for notification
  return {
    winnerName: winnerId === playerAId ? playerA.name : playerB.name,
    loserName: loserId === playerAId ? playerA.name : playerB.name,
    ratingChange: Math.round(ratingChange),
  };
}
