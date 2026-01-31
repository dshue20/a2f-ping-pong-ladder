// src/App.tsx
import { Box, Tab, Tabs } from "@mui/material";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";

import LadderTable from "./components/LadderTable";
import MatchHistory from "./components/MatchHistory";
// import PlayerProfile from "./components/PlayerProfile";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine which tab is active based on URL
  const currentTab = (() => {
    if (location.pathname.startsWith("/matches")) return "/matches";
    if (location.pathname.startsWith("/players")) return false; // no tab selected
    return "/";
  })();

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Tabs Navigation */}
      <Tabs
        value={currentTab}
        onChange={(_, value) => navigate(value)}
        centered
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Ladder" value="/" />
        <Tab label="Match History" value="/matches" />
      </Tabs>

      {/* Routed Content */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <Routes>
          <Route path="/" element={<LadderTable />} />
          <Route path="/matches" element={<MatchHistory />} />
          {/* <Route path="/players/:playerId" element={<PlayerProfile />} /> */}
        </Routes>
      </Box>
    </Box>
  );
}
