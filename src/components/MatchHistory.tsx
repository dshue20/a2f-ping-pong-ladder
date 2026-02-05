import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
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
import { deleteMatch } from "../services/deleteMatch";
import { editMatch } from "../services/editMatch";
import type { Player } from "../types";
import AddGameModal from "./AddGameModal";

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

export default function MatchHistory() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<MatchRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [matchToEdit, setMatchToEdit] = useState<MatchRow | null>(null);

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
      renderCell: (params) => {
        const row = params.row;
        const playerAWon = row.scoreA > row.scoreB;
        const winner = playerAWon ? row.playerAName : row.playerBName;
        const loser = playerAWon ? row.playerBName : row.playerAName;
        const winnerChange = playerAWon ? row.ratingChangeA : row.ratingChangeB;
        const loserChange = playerAWon ? row.ratingChangeB : row.ratingChangeA;

        return (
          <Box>
            {winner}{" "}
            <Box
              component="span"
              sx={{ color: "success.main", fontWeight: 600 }}
            >
              (+{Math.round(winnerChange)})
            </Box>{" "}
            def {loser}{" "}
            <Box component="span" sx={{ color: "error.main", fontWeight: 600 }}>
              ({Math.round(loserChange)})
            </Box>
          </Box>
        );
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
        return `${winnerScore} — ${loserScore}`;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => (
        <Stack
          direction="row"
          spacing={1}
          justifyContent="center"
          alignItems="center"
          sx={{ height: "100%" }}
        >
          <Tooltip title="Edit">
            <IconButton
              color="primary"
              size="small"
              onClick={() => handleEditClick(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              color="error"
              size="small"
              onClick={() => handleDeleteClick(params.row)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
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

  async function fetchPlayers() {
    const q = query(collection(db, "players"), orderBy("name"));
    const snapshot = await getDocs(q);

    const data: Player[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Player, "id">),
    }));

    setPlayers(data);
  }

  const handleEditClick = (match: MatchRow) => {
    setMatchToEdit(match);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (
    playerAId: string,
    playerBId: string,
    scoreA: number,
    scoreB: number,
  ) => {
    if (!matchToEdit) return;

    try {
      await editMatch(matchToEdit.id, playerAId, playerBId, scoreA, scoreB);
      await fetchMatches(); // Refresh the list
      setEditModalOpen(false);
      setMatchToEdit(null);
    } catch (error) {
      console.error("Error editing match:", error);
      alert("Failed to edit match. Please try again.");
    }
  };

  const handleDeleteClick = (match: MatchRow) => {
    setMatchToDelete(match);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!matchToDelete) return;

    setDeleting(true);
    try {
      await deleteMatch(matchToDelete.id);
      await fetchMatches(); // Refresh the list
      setDeleteDialogOpen(false);
      setMatchToDelete(null);
    } catch (error) {
      console.error("Error deleting match:", error);
      alert("Failed to delete match. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setMatchToDelete(null);
  };

  useEffect(() => {
    fetchMatches();
    fetchPlayers();
  }, []);

  const getMatchDescription = () => {
    if (!matchToDelete) return "";
    const playerAWon = matchToDelete.scoreA > matchToDelete.scoreB;
    const winner = playerAWon
      ? matchToDelete.playerAName
      : matchToDelete.playerBName;
    const loser = playerAWon
      ? matchToDelete.playerBName
      : matchToDelete.playerAName;
    const winnerScore = Math.max(matchToDelete.scoreA, matchToDelete.scoreB);
    const loserScore = Math.min(matchToDelete.scoreA, matchToDelete.scoreB);
    const winnerChange = playerAWon
      ? matchToDelete.ratingChangeA
      : matchToDelete.ratingChangeB;
    const loserChange = playerAWon
      ? matchToDelete.ratingChangeB
      : matchToDelete.ratingChangeA;
    return `${winner} (+${Math.round(winnerChange)}) def ${loser} (${Math.round(loserChange)}) — ${winnerScore}-${loserScore}`;
  };

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

      {/* Edit Modal */}
      {matchToEdit && (
        <AddGameModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setMatchToEdit(null);
          }}
          players={players}
          onSubmit={handleEditSubmit}
          editMode={true}
          initialPlayerAId={matchToEdit.playerAId}
          initialPlayerBId={matchToEdit.playerBId}
          initialScoreA={matchToEdit.scoreA}
          initialScoreB={matchToEdit.scoreB}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
      >
        <DialogTitle>Delete Match?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this match?
            <br />
            <br />
            <strong>{getMatchDescription()}</strong>
            <br />
            <br />
            This will reverse all rating changes, wins, and losses for both
            players. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Match"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
