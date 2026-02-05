import dotenv from "dotenv";
dotenv.config();

import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import type { Player } from "../types";

async function debugPlayers() {
  console.log("Checking Firebase connection...");
  console.log("Project ID:", process.env.VITE_FIREBASE_PROJECT_ID);

  try {
    const playersRef = collection(db, "players");
    const snapshot = await getDocs(playersRef);

    console.log(`\nFound ${snapshot.docs.length} players in database:\n`);

    snapshot.docs.forEach((docSnap) => {
      const player = docSnap.data() as Player;
      console.log(`  ${player.name}:`);
      console.log(`    ID: ${docSnap.id}`);
      console.log(`    Rating: ${player.rating}`);
      console.log(`    Starting Rating: ${player.startingRating ?? "NOT SET"}`);
      console.log(`    Games Played: ${player.gamesPlayed}`);
      console.log();
    });
  } catch (error) {
    console.error("Error fetching players:", error);
  }
}

debugPlayers()
  .then(() => {
    console.log("Debug complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Debug failed:", error);
    process.exit(1);
  });
