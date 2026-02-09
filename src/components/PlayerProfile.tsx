import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, IconButton, Paper, Stack, Typography } from "@mui/material";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { db } from "../firebase";
import type { Player } from "../types";
import MatchHistory from "./MatchHistory";

type MatchRow = {
  id: string;
  playerAName: string;
  playerBName: string;
  playerAId: string;
  playerBId: string;
  scoreA: number;
  scoreB: number;
  winnerId: string;
  ratingChangeA: number;
  ratingChangeB: number;
  createdAt: Timestamp;
};

type RatingDataPoint = {
  date: string;
  displayDate: string; // For axis display
  rating: number;
  matchId: string;
  opponent: string;
  result: "W" | "L";
  matchNumber: number; // For unique identification
  playerScore: number;
  opponentScore: number;
};

export default function PlayerProfile() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();

  const [player, setPlayer] = useState<Player | null>(null);
  const [ratingHistory, setRatingHistory] = useState<RatingDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchPlayerData() {
    if (!playerId) return;

    setLoading(true);

    // Fetch player info
    const playersRef = collection(db, "players");
    const playersSnapshot = await getDocs(playersRef);
    const playersData: Player[] = playersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Player, "id">),
    }));

    const currentPlayer = playersData.find((p) => p.id === playerId);
    setPlayer(currentPlayer || null);

    // Fetch all matches involving this player
    const matchesRef = collection(db, "matches");
    const q = query(matchesRef, orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);

    const allMatches: MatchRow[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<MatchRow, "id">),
    }));

    // Filter matches for this player
    const playerMatches = allMatches.filter(
      (match) => match.playerAId === playerId || match.playerBId === playerId,
    );

    // Build rating history
    if (currentPlayer) {
      const history: RatingDataPoint[] = [];
      let currentRating = currentPlayer.startingRating ?? 1000;

      // Add starting point
      if (playerMatches.length > 0) {
        const firstMatchDate = playerMatches[0].createdAt.toDate();
        history.push({
          date: `0`, // Use index as unique key
          displayDate: firstMatchDate.toLocaleDateString(),
          rating: currentRating,
          matchId: "start",
          opponent: "Starting Rating",
          result: "W",
          matchNumber: 0,
          playerScore: 0,
          opponentScore: 0,
        });
      }

      // Add data point for each match
      playerMatches.forEach((match, index) => {
        const isPlayerA = match.playerAId === playerId;
        const ratingChange = isPlayerA
          ? match.ratingChangeA
          : match.ratingChangeB;
        currentRating += ratingChange;

        const opponent = isPlayerA ? match.playerBName : match.playerAName;
        const won = isPlayerA
          ? match.scoreA > match.scoreB
          : match.scoreB > match.scoreA;
        const playerScore = isPlayerA ? match.scoreA : match.scoreB;
        const opponentScore = isPlayerA ? match.scoreB : match.scoreA;

        history.push({
          date: `${index + 1}`, // Use index as unique key
          displayDate: match.createdAt.toDate().toLocaleDateString(),
          rating: Math.round(currentRating),
          matchId: match.id,
          opponent: opponent,
          result: won ? "W" : "L",
          matchNumber: index + 1,
          playerScore: playerScore,
          opponentScore: opponentScore,
        });
      });

      setRatingHistory(history);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchPlayerData();
  }, [playerId]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!player) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Player not found</Typography>
        <IconButton onClick={() => navigate("/")} sx={{ mt: 2 }}>
          <ArrowBackIcon />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      sx={{ height: "100%", display: "flex", flexDirection: "column", p: 2 }}
    >
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={() => navigate("/")} size="large">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight={600}>
            {player.name}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={4} sx={{ mt: 2, ml: 7 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Rating
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              {Math.round(player.rating)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Record
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              {player.wins}-{player.losses}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Win %
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              {player.wins + player.losses === 0
                ? "0%"
                : `${((player.wins / (player.wins + player.losses)) * 100).toFixed(0)}%`}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Streak
            </Typography>
            <Typography
              variant="h5"
              fontWeight={600}
              sx={{
                color: player.streak?.startsWith("W")
                  ? "success.main"
                  : player.streak?.startsWith("L")
                    ? "error.main"
                    : "text.primary",
              }}
            >
              {player.streak || "-"}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Rating Chart */}
      <Paper elevation={3} sx={{ p: 3, mb: 2, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Rating History
        </Typography>
        {ratingHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ratingHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="matchNumber"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
                tickFormatter={(value, index) => {
                  // Show date labels, but skip some to avoid crowding
                  const dataPoint = ratingHistory[index];
                  if (!dataPoint) return "";

                  // Show every nth label based on total matches to avoid overcrowding
                  const totalMatches = ratingHistory.length;
                  const skipInterval = Math.max(
                    1,
                    Math.floor(totalMatches / 10),
                  );

                  if (
                    index === 0 ||
                    index === totalMatches - 1 ||
                    index % skipInterval === 0
                  ) {
                    return dataPoint.displayDate;
                  }
                  return "";
                }}
              />
              <YAxis
                domain={["dataMin - 20", "dataMax + 20"]}
                tick={{ fontSize: 12 }}
              />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as RatingDataPoint;
                    return (
                      <Box
                        sx={{
                          bgcolor: "background.paper",
                          p: 1.5,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {data.displayDate}
                          {data.matchId !== "start" &&
                            ` (Match #${data.matchNumber})`}
                        </Typography>
                        <Typography variant="body2">
                          Rating: {data.rating}
                        </Typography>
                        {data.matchId !== "start" && (
                          <Typography variant="body2">
                            <Box
                              component="span"
                              sx={{
                                color:
                                  data.result === "W"
                                    ? "success.main"
                                    : "error.main",
                                fontWeight: 600,
                              }}
                            >
                              {data.result === "W" ? "Won" : "Lost"}
                            </Box>{" "}
                            vs {data.opponent} ({data.playerScore}-
                            {data.opponentScore})
                          </Typography>
                        )}
                      </Box>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#1976d2"
                strokeWidth={2}
                dot={{ fill: "#1976d2", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Typography color="text.secondary">No matches played yet</Typography>
        )}
      </Paper>

      {/* Match History - Now using reusable component */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <MatchHistory playerId={playerId} showTitle={false} />
      </Box>
    </Box>
  );
}
