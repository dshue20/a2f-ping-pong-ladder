import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Now import your firebase and migration
import { migratePlayersWithKnownStartingRatings } from "./addStartingRating";

// Run the migration
migratePlayersWithKnownStartingRatings()
  .then(() => {
    console.log("✅ Migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });
