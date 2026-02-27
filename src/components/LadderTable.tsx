import { Box, Button, Paper, Snackbar, Stack, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { submitMatch } from "../services/submitMatch";
import type { Player } from "../types";
import AddGameModal from "./AddGameModal";

type Row = Player & {
  rank: number;
};

export default function LadderTableMUI() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [addGameOpen, setAddGameOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

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
      renderCell: (params) => (
        <Box
          onClick={() => navigate(`/players/${params.row.id}`)}
          sx={{
            cursor: "pointer",
            color: "primary.main",
            fontWeight: 500,
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          {params.row.name}
        </Box>
      ),
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
    // {
    //   field: "ratingPointsWonPerGame",
    //   headerName: "Rating Pts Won / Game",
    //   flex: 1.5,
    //   align: "center",
    //   headerAlign: "center",
    //   valueGetter: (_, row) => {
    //     const wins = row.wins ?? 0;
    //     const losses = row.losses ?? 0;
    //     const games = wins + losses;
    //     // Use startingRating if available, otherwise fallback to 1000 for new players
    //     // or current rating for legacy players (this assumes they haven't gained/lost points yet)
    //     const startRating =
    //       (row as Player & { startingRating?: number }).startingRating ?? 1000;
    //     const pointsWon = row.rating - startRating;
    //     return games === 0 ? "0.0" : (pointsWon / games).toFixed(1);
    //   },
    // },
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
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: 2,
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
          borderRadius: "12px 12px 0 0",
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
      <Paper
        elevation={3}
        sx={{
          flex: 1,
          borderRadius: "0 0 12px 12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
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
            flex: 1,
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

      <AddGameModal
        open={addGameOpen}
        onClose={() => setAddGameOpen(false)}
        players={players}
        onSubmit={async (playerAId, playerBId, scoreA, scoreB) => {
          const result = await submitMatch({
            playerAId,
            playerBId,
            scoreA,
            scoreB,
          });
          fetchPlayers(); // refresh ladder after new game

          // Show notification with rating change
          if (result) {
            setNotificationMessage(
              `${result.winnerName} gained ${result.ratingChange} points by defeating ${result.loserName}!`,
            );
            setNotificationOpen(true);
          }
        }}
      />

      <Snackbar
        open={notificationOpen}
        autoHideDuration={4000}
        onClose={() => setNotificationOpen(false)}
        message={notificationMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{
          mb: 3, // Margin bottom for padding from edge
          "& .MuiSnackbarContent-root": {
            backgroundColor: "#323232", // Dark background
            color: "#fff", // White text
            fontSize: "1rem",
            fontWeight: 500,
            borderRadius: "12px", // Rounded corners
          },
        }}
      />
    </Box>
  );
}
