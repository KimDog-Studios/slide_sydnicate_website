"use client";
import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import RefreshIcon from "@mui/icons-material/Refresh";

type Props = {
  isFetching: boolean;
  searchInput: string;
  setSearchInput: (v: string) => void;
  openFilter: () => void;
  refreshNow: () => void;
  resetAll: () => void;
};

export default function Toolbar({ isFetching, searchInput, setSearchInput, openFilter, refreshNow, resetAll }: Props) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, background: "rgba(0,0,0,0.45)", p: "4px 8px", borderRadius: 1 }}>
          <SearchIcon sx={{ color: "#fff" }} />
          <TextField
            variant="standard"
            placeholder="Search server name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            size="small"
            disabled={isFetching}
            InputProps={{ disableUnderline: true, sx: { color: "#fff" } }}
            sx={{ minWidth: 220 }}
          />
        </Box>

        <Button size="small" variant="outlined" onClick={openFilter} startIcon={<FilterListIcon />} disabled={isFetching} sx={{ color: "#fff" }}>
          Filter By
        </Button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button size="small" variant="outlined" onClick={refreshNow} startIcon={<RefreshIcon />} disabled={isFetching} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.06)" }}>
          Refresh Now
        </Button>
        <Button size="small" variant="contained" onClick={resetAll} startIcon={<RefreshIcon />} disabled={isFetching} sx={{ background: "#7c3aed" }}>
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
