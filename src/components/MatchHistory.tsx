import { Box, Paper, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase";

type MatchRow = {
  id: string;
  playerAName: string;
  playerBName: string;
  scoreA: number;
  scoreB: number;
  winnerId: string;
  createdAt: Timestamp;
};

export default function MatchHistory() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  const columns: GridColDef<MatchRow>[] = [
    {
      field: "createdAt",
      headerName: "Date",
      flex: 1.2,
      align: "center",
      headerAlign: "center",
      valueGetter: (_, row) => row.createdAt?.toDate().toLocaleDateString(),
    },
    {
      field: "match",
      headerName: "Match",
      flex: 2.5,
      align: "center",
      headerAlign: "center",
      valueGetter: (_, row) => {
        const winner =
          row.scoreA > row.scoreB ? row.playerAName : row.playerBName;
        const loser =
          row.scoreA > row.scoreB ? row.playerBName : row.playerAName;
        console.log({ winner, loser, row });
        return `${winner} def ${loser}`;
      },
    },
    {
      field: "score",
      headerName: "Score",
      flex: 1,
      align: "center",
      headerAlign: "center",
      valueGetter: (_, row) => {
        const winnerScore = Math.max(row.scoreA, row.scoreB);
        const loserScore = Math.min(row.scoreA, row.scoreB);
        return `${winnerScore} – ${loserScore}`;
      },
    },
  ];

  async function fetchMatches() {
    setLoading(true);

    const q = query(collection(db, "matches"), orderBy("createdAt", "desc"));

    const snapshot = await getDocs(q);

    const data: MatchRow[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<MatchRow, "id">),
    }));

    setRows(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchMatches();
  }, []);

  return (
    <Box sx={{ p: 2, height: "100%" }}>
      <Paper
        elevation={3}
        sx={{
          height: "100%",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h5" fontWeight={600}>
            📜 Match History
          </Typography>
        </Box>

        <DataGrid<MatchRow>
          rows={rows}
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
              fontSize: "0.95rem",
              justifyContent: "center",
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "grey.200",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 700,
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "rgba(25, 118, 210, 0.04)",
            },
          }}
        />
      </Paper>
    </Box>
  );
}
