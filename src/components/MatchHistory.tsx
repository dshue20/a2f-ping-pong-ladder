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
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { deleteMatch } from "../services/deleteMatch";
import { editMatch } from "../services/editMatch";
import type { Player } from "../types";
import AddGameModal from "./AddGameModal";
import PlayerSelect from "./PlayerSelect";

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

type Props = {
  playerId?: string; // Optional: filter matches for a specific player
  showTitle?: boolean; // Optional: show/hide the title
  showSearch?: boolean; // Optional: show/hide search bar
  autoHeight?: boolean; // Optional: allow table to grow with content instead of fixed height
  onOpponentSelected?: (opponentId: string, opponentName: string) => void; // Callback when opponent is selected
  headToHeadRecord?: React.ReactNode; // Optional: display head-to-head record
};

export default function MatchHistory({
  playerId,
  showTitle = true,
  showSearch = true,
  autoHeight = false,
  onOpponentSelected,
  headToHeadRecord,
}: Props) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<MatchRow[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]); // For PlayerSelect dropdown
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<MatchRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");

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
    ...(playerId
      ? [
          // When filtering by player, show opponent instead of full match
          {
            field: "opponent" as const,
            headerName: "Opponent",
            flex: 2,
            align: "center" as const,
            headerAlign: "center" as const,
            renderCell: (params: any) => {
              const row = params.row as MatchRow;
              const opponentId =
                row.playerAId === playerId ? row.playerBId : row.playerAId;
              const opponentName =
                row.playerAId === playerId ? row.playerBName : row.playerAName;

              return (
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/players/${opponentId}`);
                  }}
                  sx={{
                    cursor: "pointer",
                    color: "primary.main",
                    fontWeight: 500,
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  {opponentName}
                </Box>
              );
            },
          },
          {
            field: "result" as const,
            headerName: "Result",
            flex: 1,
            align: "center" as const,
            headerAlign: "center" as const,
            renderCell: (params: any) => {
              const row = params.row as MatchRow;
              const isPlayerA = row.playerAId === playerId;
              const won = isPlayerA
                ? row.scoreA > row.scoreB
                : row.scoreB > row.scoreA;
              const color = won ? "success.main" : "error.main";
              const result = won ? "W" : "L";

              return (
                <Box sx={{ color, fontWeight: 600, fontSize: "1.1rem" }}>
                  {result}
                </Box>
              );
            },
          },
        ]
      : [
          // When showing all matches, show full match details
          {
            field: "match" as const,
            headerName: "Match",
            flex: 2.5,
            align: "center" as const,
            headerAlign: "center" as const,
            renderCell: (params: any) => {
              const row = params.row as MatchRow;
              const playerAWon = row.scoreA > row.scoreB;
              const winnerId = playerAWon ? row.playerAId : row.playerBId;
              const loserId = playerAWon ? row.playerBId : row.playerAId;
              const winner = playerAWon ? row.playerAName : row.playerBName;
              const loser = playerAWon ? row.playerBName : row.playerAName;
              const winnerChange = playerAWon
                ? row.ratingChangeA
                : row.ratingChangeB;
              const loserChange = playerAWon
                ? row.ratingChangeB
                : row.ratingChangeA;

              return (
                <Box>
                  <Box
                    component="span"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/players/${winnerId}`);
                    }}
                    sx={{
                      cursor: "pointer",
                      color: "primary.main",
                      fontWeight: 500,
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    {winner}
                  </Box>{" "}
                  <Box
                    component="span"
                    sx={{ color: "success.main", fontWeight: 600 }}
                  >
                    (+{Math.round(winnerChange)})
                  </Box>{" "}
                  def{" "}
                  <Box
                    component="span"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/players/${loserId}`);
                    }}
                    sx={{
                      cursor: "pointer",
                      color: "primary.main",
                      fontWeight: 500,
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    {loser}
                  </Box>{" "}
                  <Box
                    component="span"
                    sx={{ color: "error.main", fontWeight: 600 }}
                  >
                    ({Math.round(loserChange)})
                  </Box>
                </Box>
              );
            },
          },
        ]),
    {
      field: "score",
      headerName: "Score",
      flex: 1,
      align: "center",
      headerAlign: "center",
      valueGetter: (_, row) => {
        if (playerId) {
          // Show player's score first when filtering by player
          const isPlayerA = row.playerAId === playerId;
          const playerScore = isPlayerA ? row.scoreA : row.scoreB;
          const opponentScore = isPlayerA ? row.scoreB : row.scoreA;
          return `${playerScore} — ${opponentScore}`;
        } else {
          // Show winner's score first when showing all matches
          const winnerScore = Math.max(row.scoreA, row.scoreB);
          const loserScore = Math.min(row.scoreA, row.scoreB);
          return `${winnerScore} — ${loserScore}`;
        }
      },
    },
    ...(playerId
      ? [
          {
            field: "ratingChange" as const,
            headerName: "Rating Change",
            flex: 1,
            align: "center" as const,
            headerAlign: "center" as const,
            renderCell: (params: any) => {
              const row = params.row as MatchRow;
              const isPlayerA = row.playerAId === playerId;
              const change = isPlayerA ? row.ratingChangeA : row.ratingChangeB;
              const color = change >= 0 ? "success.main" : "error.main";

              return (
                <Box sx={{ color, fontWeight: 600 }}>
                  {change >= 0 ? "+" : ""}
                  {Math.round(change)}
                </Box>
              );
            },
          },
        ]
      : []),
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

    // Filter by player if playerId is provided
    const filtered = playerId
      ? data.filter(
          (match) =>
            match.playerAId === playerId || match.playerBId === playerId,
        )
      : data;

    setRows(filtered);
    setFilteredRows(filtered);
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

  // Update filtered players based on matches and playerId
  useEffect(() => {
    if (playerId) {
      // When filtering by a specific player, show only opponents who have played against them
      const opponentIds = new Set<string>();
      rows.forEach((match) => {
        if (match.playerAId === playerId) {
          opponentIds.add(match.playerBId);
        } else if (match.playerBId === playerId) {
          opponentIds.add(match.playerAId);
        }
      });

      const availablePlayers = players.filter((player) =>
        opponentIds.has(player.id),
      );
      setFilteredPlayers(availablePlayers);
    } else {
      // When showing all matches, show only players who have played at least one match
      const playerIds = new Set<string>();
      rows.forEach((match) => {
        playerIds.add(match.playerAId);
        playerIds.add(match.playerBId);
      });

      const availablePlayers = players.filter((player) =>
        playerIds.has(player.id),
      );
      setFilteredPlayers(availablePlayers);
    }
  }, [rows, players, playerId]);

  // Filter matches based on selected player
  useEffect(() => {
    if (!selectedPlayerId) {
      setFilteredRows(rows);
      return;
    }

    const filtered = rows.filter((match) => {
      // Filter by selected player
      return (
        match.playerAId === selectedPlayerId ||
        match.playerBId === selectedPlayerId
      );
    });

    setFilteredRows(filtered);
  }, [selectedPlayerId, rows]);

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
  }, [playerId]);

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
    <Box sx={{ p: 2, height: autoHeight ? "auto" : "100%" }}>
      <Paper
        elevation={3}
        sx={{
          height: autoHeight ? "auto" : "100%",
          borderRadius: 3,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack direction="row" spacing={2} alignItems="center">
              {showTitle && (
                <Typography variant="h5" fontWeight={600}>
                  📜 Match History
                  {playerId && ` (${filteredRows.length})`}
                </Typography>
              )}
              {headToHeadRecord && headToHeadRecord}
            </Stack>
            {showSearch && (
              <Box sx={{ width: 250 }}>
                <PlayerSelect
                  label={playerId ? "Filter by opponent" : "Filter by player"}
                  players={filteredPlayers}
                  value={selectedPlayerId}
                  onChange={(newPlayerId) => {
                    setSelectedPlayerId(newPlayerId);
                    // Call the callback if provided
                    if (onOpponentSelected && newPlayerId) {
                      const selectedPlayer = filteredPlayers.find(
                        (p) => p.id === newPlayerId,
                      );
                      if (selectedPlayer) {
                        onOpponentSelected(newPlayerId, selectedPlayer.name);
                      }
                    } else if (onOpponentSelected && !newPlayerId) {
                      // Clear selection
                      onOpponentSelected("", "");
                    }
                  }}
                  onPlayerAdded={() => {}} // Not used since addNewPlayer is false
                  addNewPlayer={false}
                />
              </Box>
            )}
          </Stack>
        </Box>

        <DataGrid<MatchRow>
          rows={filteredRows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: playerId ? 10 : 25, page: 0 },
            },
          }}
          autoHeight={autoHeight}
          sx={{
            border: "none",
            flex: autoHeight ? undefined : 1,
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
