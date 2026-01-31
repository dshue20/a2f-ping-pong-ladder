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
    winnerId: string,
    loserId: string,
    winningScore: number,
    losingScore: number,
  ) => void;
};

export default function AddGameModal({
  open,
  onClose,
  players: initialPlayers,
  onSubmit,
}: Props) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [playerAId, setPlayerAId] = useState("");
  const [playerBId, setPlayerBId] = useState("");
  const [scoreA, setScoreA] = useState<number | "">("");
  const [scoreB, setScoreB] = useState<number | "">("");

  // Keep players in sync when parent updates initialPlayers
  useEffect(() => {
    setPlayers(initialPlayers);
  }, [initialPlayers]);

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

    setPlayerAId("");
    setPlayerBId("");
    setScoreA("");
    setScoreB("");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Game</DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>
          <PlayerSelect
            label="Winner"
            players={players}
            value={playerAId}
            excludeId={playerBId}
            onChange={setPlayerAId}
            onPlayerAdded={(newPlayer) => {
              setPlayers((prev) => [...prev, newPlayer]); // add to dropdown
              setPlayerAId(newPlayer.id); // select immediately
            }}
          />

          <PlayerSelect
            label="Loser"
            players={players}
            value={playerBId}
            excludeId={playerAId}
            onChange={setPlayerBId} // ✅ FIXED
            onPlayerAdded={(newPlayer) => {
              setPlayers((prev) => [...prev, newPlayer]); // add to dropdown
              setPlayerAId(newPlayer.id); // select immediately
            }}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              label="Winning Score"
              type="number"
              value={scoreA}
              onChange={(e) => setScoreA(Number(e.target.value))}
              fullWidth
            />
            <TextField
              label="Losing Score"
              type="number"
              value={scoreB}
              onChange={(e) => setScoreB(Number(e.target.value))}
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          Submit Game
        </Button>
      </DialogActions>
    </Dialog>
  );
}
