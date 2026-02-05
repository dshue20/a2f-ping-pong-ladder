import type { Timestamp } from "firebase/firestore";

export interface Player {
  id: string;
  name: string;

  wins: number;
  losses: number;

  rating: number;
  startingRating?: number;

  streak: string;

  gamesPlayed: number;
}

export interface Match {
  id: string;

  playerAId: string;
  playerAName: string;

  playerBId: string;
  playerBName: string;

  scoreA: number;
  scoreB: number;

  winnerId: string;
  loserId: string;

  ratingChangeA: number;
  ratingChangeB: number;

  createdAt: Timestamp;
}
