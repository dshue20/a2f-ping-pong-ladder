import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { Player } from "../types";
import PlayerSelect from "./PlayerSelect";

type Props = {
  open: boolean;
  onClose: () => void;
  players: Player[];
  onSubmit: (
    playerAId: string,
    playerBId: string,
    scoreA: number,
    scoreB: number,
  ) => void;
  // Optional props for edit mode
  editMode?: boolean;
  initialPlayerAId?: string;
  initialPlayerBId?: string;
  initialScoreA?: number | "";
  initialScoreB?: number | "";
};

export default function AddGameModal({
  open,
  onClose,
  players: initialPlayers,
  onSubmit,
  editMode = false,
  initialPlayerAId = "",
  initialPlayerBId = "",
  initialScoreA = "",
  initialScoreB = "",
}: Props) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [playerAId, setPlayerAId] = useState(initialPlayerAId);
  const [playerBId, setPlayerBId] = useState(initialPlayerBId);
  const [scoreA, setScoreA] = useState<number | "">(initialScoreA);
  const [scoreB, setScoreB] = useState<number | "">(initialScoreB);

  // Keep players in sync when parent updates initialPlayers
  useEffect(() => {
    setPlayers(initialPlayers);
  }, [initialPlayers]);

  // Update state when initial values change (for edit mode)
  useEffect(() => {
    if (open) {
      setPlayerAId(initialPlayerAId);
      setPlayerBId(initialPlayerBId);
      setScoreA(initialScoreA);
      setScoreB(initialScoreB);
    }
  }, [open, initialPlayerAId, initialPlayerBId, initialScoreA, initialScoreB]);

  const canSubmit =
    playerAId &&
    playerBId &&
    playerAId !== playerBId &&
    scoreA !== "" &&
    scoreB !== "";

  const handleSubmit = () => {
    if (!canSubmit) return;

    onSubmit(playerAId, playerBId, Number(scoreA), Number(scoreB));
    onClose();

    // Only reset if not in edit mode
    if (!editMode) {
      setPlayerAId("");
      setPlayerBId("");
      setScoreA("");
      setScoreB("");
    }
  };

  const handleClose = () => {
    onClose();
    // Only reset if not in edit mode
    if (!editMode) {
      setPlayerAId("");
      setPlayerBId("");
      setScoreA("");
      setScoreB("");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editMode ? "Edit Game" : "Add Game"}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>
          <PlayerSelect
            label="Player A"
            players={players}
            value={playerAId}
            excludeId={playerBId}
            onChange={setPlayerAId}
            onPlayerAdded={(newPlayer) => {
              setPlayers((prev) => [...prev, newPlayer]);
              setPlayerAId(newPlayer.id);
            }}
          />

          <PlayerSelect
            label="Player B"
            players={players}
            value={playerBId}
            excludeId={playerAId}
            onChange={setPlayerBId}
            onPlayerAdded={(newPlayer) => {
              setPlayers((prev) => [...prev, newPlayer]);
              setPlayerBId(newPlayer.id);
            }}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              label="Player A Score"
              type="number"
              value={scoreA}
              onChange={(e) => setScoreA(Number(e.target.value))}
              fullWidth
            />
            <TextField
              label="Player B Score"
              type="number"
              value={scoreB}
              onChange={(e) => setScoreB(Number(e.target.value))}
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {editMode ? "Update Game" : "Submit Game"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
