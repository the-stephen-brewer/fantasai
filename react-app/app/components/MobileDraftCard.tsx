import { Paper, Box, Typography, Chip } from "@mui/material";
import type { DraftAnalysis } from "../models";

interface MobileDraftCardProps {
  pick: DraftAnalysis;
}

// Helper for ADP Deviation coloring (replicated from PositionalInsights for consistency)
const getAdpDeltaColor = (
  adpDelta: number,
): "success" | "error" | "default" => {
  if (adpDelta < -2) return "success"; // Steal (Good)
  if (adpDelta > 2) return "error"; // Reach (Bad)
  return "default";
};

export default function MobileDraftCard({ pick }: MobileDraftCardProps) {
  const draftValue = pick.draft_value;
  const draftValueColor =
    draftValue > 0 ? "success" : draftValue < 0 ? "error" : "default";
  const draftValueGlowColor =
    draftValue > 0
      ? "rgba(46, 125, 50, 0.5)"
      : draftValue < 0
        ? "rgba(211, 47, 47, 0.5)"
        : "rgba(128, 128, 128, 0.5)";

  const adpDeltaColor = getAdpDeltaColor(pick.adp_delta);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mb: 1.5,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        border: `1px solid ${draftValueGlowColor}`,
        boxShadow: `0 0 8px ${draftValueGlowColor}`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          <Typography
            component="span"
            sx={{
              color: "primary.main",
              fontWeight: "bold",
              fontSize: "1.2em",
              mr: 1,
            }}
          >
            #{pick.pick_no}
          </Typography>
          {pick.full_name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {pick.display_name}
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {pick.position} • {pick.team} • Round {pick.round}
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "space-around", mt: 2 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block" }}
          >
            Season Value
          </Typography>
          <Chip
            label={draftValue.toFixed(2)}
            color={draftValueColor}
            size="small"
            sx={{ fontWeight: "bold" }}
          />
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block" }}
          >
            Reach/Value
          </Typography>
          <Chip
            label={pick.adp_delta.toFixed(2)}
            color={adpDeltaColor}
            size="small"
            sx={{ fontWeight: "bold" }}
          />
        </Box>
      </Box>
    </Paper>
  );
}
