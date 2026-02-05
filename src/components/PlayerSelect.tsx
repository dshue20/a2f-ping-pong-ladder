import { Autocomplete, Button, Stack, TextField } from "@mui/material";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { db } from "../firebase";
import type { Player } from "../types";

type PlayerOption = Player | { id: "__add__"; name: string };

type Props = {
  label: string;
  players: Player[];
  value: string;
  onChange: (playerId: string) => void;
  onPlayerAdded: (player: Player) => void; // 👈 NEW
  excludeId?: string;
};

export default function PlayerSelect({
  label,
  players,
  value,
  onChange,
  onPlayerAdded,
  excludeId,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const options: PlayerOption[] = [
    { id: "__add__", name: "➕ Add new player" },
    ...players
      .filter((p) => p.id !== excludeId)
      .sort((a, b) => a.name.localeCompare(b.name)),
  ];

  const handleAddPlayer = async () => {
    const name = newName.trim();
    if (!name) return;

    const initialRating = 1000;

    const docRef = await addDoc(collection(db, "players"), {
      name,
      wins: 0,
      losses: 0,
      rating: initialRating,
      startingRating: initialRating,
      streak: "",
      createdAt: serverTimestamp(),
    });

    const newPlayer: Player = {
      id: docRef.id,
      name,
      wins: 0,
      losses: 0,
      rating: initialRating,
      startingRating: initialRating,
      streak: "",
      gamesPlayed: 0,
    };

    onPlayerAdded(newPlayer); // 👈 add to parent state
    onChange(newPlayer.id); // 👈 select immediately
    setNewName("");
    setAdding(false);
  };

  if (adding) {
    return (
      <Stack spacing={1}>
        <TextField
          label="New player name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          autoFocus
        />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={handleAddPlayer}>
            Add
          </Button>
          <Button onClick={() => setAdding(false)}>Cancel</Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Autocomplete<PlayerOption>
      options={options}
      getOptionLabel={(option) => option.name}
      value={options.find((o) => o.id === value) ?? null}
      onChange={(_, option) => {
        if (!option) return;

        if (option.id === "__add__") {
          setAdding(true);
        } else {
          onChange(option.id);
        }
      }}
      renderInput={(params) => <TextField {...params} label={label} />}
      fullWidth
    />
  );
}
