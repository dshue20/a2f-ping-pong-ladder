import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import type { Player } from "../types";

/**
 * Seeds some test players into Firestore.
 * Only call once to avoid duplicates.
 */
export async function seedPlayers() {
  const players: Omit<Player, "id">[] = [
    {
      name: "Wesley",
      wins: 0,
      losses: 0,
      rating: 1200,
      startingRating: 1200,
      streak: "-",
      gamesPlayed: 0,
    },
    {
      name: "Derek",
      wins: 0,
      losses: 0,
      rating: 1180,
      startingRating: 1180,
      streak: "-",
      gamesPlayed: 0,
    },
    {
      name: "Matt",
      wins: 0,
      losses: 0,
      rating: 1160,
      startingRating: 1160,
      streak: "-",
      gamesPlayed: 0,
    },
    {
      name: "JWin",
      wins: 0,
      losses: 0,
      rating: 1140,
      startingRating: 1140,
      streak: "-",
      gamesPlayed: 0,
    },
    {
      name: "Ryuta",
      wins: 0,
      losses: 0,
      rating: 1120,
      startingRating: 1120,
      streak: "-",
      gamesPlayed: 0,
    },
    {
      name: "JLin",
      wins: 0,
      losses: 0,
      rating: 1100,
      startingRating: 1100,
      streak: "-",
      gamesPlayed: 0,
    },
    {
      name: "Sophia",
      wins: 0,
      losses: 0,
      rating: 1080,
      startingRating: 1080,
      streak: "-",
      gamesPlayed: 0,
    },
    {
      name: "Victoria",
      wins: 0,
      losses: 0,
      rating: 1060,
      startingRating: 1060,
      streak: "-",
      gamesPlayed: 0,
    },
    {
      name: "Karoline",
      wins: 0,
      losses: 0,
      rating: 1040,
      startingRating: 1040,
      streak: "-",
      gamesPlayed: 0,
    },
    {
      name: "Cynt",
      wins: 0,
      losses: 0,
      rating: 1020,
      startingRating: 1020,
      streak: "-",
      gamesPlayed: 0,
    },
  ];

  for (const p of players) {
    await addDoc(collection(db, "players"), p);
  }

  console.log("Seed players added!");
}
