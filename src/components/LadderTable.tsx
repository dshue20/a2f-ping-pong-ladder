// src/components/LadderTableMUI.tsx
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { submitMatch } from "../services/submitMatch";
import type { Player } from "../types";
import AddGameModal from "./AddGameModal";

type Row = Player & {
  rank: number;
};

export default function LadderTableMUI() {
  const [players, setPlayers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [addGameOpen, setAddGameOpen] = useState(false);

  const columns: GridColDef<Row>[] = [
    {
      field: "rank",
      headerName: "#",
      flex: 0.5,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "name",
      headerName: "Name",
      flex: 2,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "rating",
      headerName: "Rating",
      flex: 1,
      align: "center",
      headerAlign: "center",
      valueGetter: (_, row) => Math.round(row.rating),
    },
    {
      field: "wins",
      headerName: "Wins",
      flex: 0.8,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "losses",
      headerName: "Losses",
      flex: 0.8,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "winPct",
      headerName: "Win %",
      flex: 1,
      align: "center",
      headerAlign: "center",
      valueGetter: (_, row) => {
        const wins = row.wins ?? 0;
        const losses = row.losses ?? 0;
        const games = wins + losses;
        return games === 0 ? "0%" : `${((wins / games) * 100).toFixed(0)}%`;
      },
    },
    {
      field: "ratingPointsWonPerGame",
      headerName: "Rating Pts Won / Game",
      flex: 1.5,
      align: "center",
      headerAlign: "center",
      valueGetter: (_, row) => {
        const wins = row.wins ?? 0;
        const losses = row.losses ?? 0;
        const games = wins + losses;
        // Use startingRating if available, otherwise fallback to 1000 for new players
        // or current rating for legacy players (this assumes they haven't gained/lost points yet)
        const startRating =
          (row as Player & { startingRating?: number }).startingRating ?? 1000;
        const pointsWon = row.rating - startRating;
        return games === 0 ? "0.0" : (pointsWon / games).toFixed(1);
      },
    },
    {
      field: "streak",
      headerName: "Streak",
      flex: 1,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const streak = params.row.streak || "-";
        if (streak === "-" || streak === "") {
          return <Box>-</Box>;
        }

        const isWinStreak = streak.startsWith("W");
        const color = isWinStreak ? "success.main" : "error.main";

        return <Box sx={{ color, fontWeight: 600 }}>{streak}</Box>;
      },
    },
  ];

  async function fetchPlayers() {
    setLoading(true);

    const q = query(collection(db, "players"), orderBy("rating", "desc"));
    const snapshot = await getDocs(q);

    const rows: Row[] = snapshot.docs.map((doc, index) => {
      const data = doc.data() as Player;
      return {
        ...data,
        id: doc.id,
        rank: index + 1,
        streak: data.streak ?? "-",
      };
    });

    setPlayers(rows);
    setLoading(false);
  }

  useEffect(() => {
    fetchPlayers();
  }, []);

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        bgcolor: "grey.100",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h4" fontWeight={600}>
            🏓 Ping Pong Ladder
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={() => setAddGameOpen(true)}
          >
            Add Game
          </Button>
        </Stack>
      </Box>

      {/* Table */}
      <Box sx={{ flex: 1, p: 2 }}>
        <Paper
          elevation={3}
          sx={{
            height: "100%",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <DataGrid<Row>
            rows={players}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25, page: 0 } },
            }}
            sx={{
              border: "none",
              "& .MuiDataGrid-cell": {
                fontSize: "1rem",
                justifyContent: "center",
              },
              "& .MuiDataGrid-columnHeaders": { backgroundColor: "grey.200" },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: 700,
                fontSize: "1.05rem",
                textAlign: "center",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "rgba(25, 118, 210, 0.04)",
              },
            }}
          />
        </Paper>
      </Box>

      <AddGameModal
        open={addGameOpen}
        onClose={() => setAddGameOpen(false)}
        players={players}
        onSubmit={async (playerAId, playerBId, scoreA, scoreB) => {
          await submitMatch({ playerAId, playerBId, scoreA, scoreB });
          fetchPlayers(); // refresh ladder after new game
        }}
      />
    </Box>
  );
}
