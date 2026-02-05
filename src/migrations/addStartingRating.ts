import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import type { Player } from "../types";

export async function migratePlayersWithKnownStartingRatings() {
  console.log("Starting migration with known starting ratings...");

  // Map of player names to their original seeded ratings
  const knownStartingRatings: Record<string, number> = {
    Wesley: 1200,
    Derek: 1180,
    Matt: 1160,
    JWin: 1140,
    Ryuta: 1120,
    JLin: 1100,
    Sophia: 1080,
    Victoria: 1060,
    Karoline: 1040,
    Cynt: 1020,
  };

  const playersRef = collection(db, "players");
  const snapshot = await getDocs(playersRef);

  const batch = writeBatch(db);
  let updateCount = 0;

  snapshot.docs.forEach((docSnap) => {
    const player = docSnap.data() as Player;

    const playerRef = doc(db, "players", docSnap.id);

    // Use known starting rating if available, otherwise use 1000
    const startingRating = knownStartingRatings[player.name] ?? 1000;

    if (startingRating !== player.startingRating) {
      batch.update(playerRef, {
        startingRating: startingRating,
      });

      updateCount++;
      console.log(
        `  Updating ${player.name}: setting startingRating to ${startingRating}`,
      );
    }
  });

  if (updateCount > 0) {
    await batch.commit();
    console.log(`Migration complete! Updated ${updateCount} players.`);
  } else {
    console.log("No players needed migration.");
  }
}
