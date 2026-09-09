import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Grid,
  Divider,
  useTheme,
  Chip,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import supabase from "../integrations/supaclient";
import type { DraftPick } from "../models";

interface BestWorstPickCardProps {
  bestPickId: number;
  worstPickId: number;
}

const PickDetail = ({
  pick,
  type,
}: {
  pick: DraftPick;
  type: "best" | "worst";
}) => {
  const theme = useTheme();
  const isBest = type === "best";
  const color = isBest ? theme.palette.success.main : theme.palette.error.main;
  const Icon = isBest ? TrendingUpIcon : TrendingDownIcon;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Icon sx={{ color, mr: 1.5 }} />
        <Typography variant="h6" component="h3" sx={{ color }}>
          {isBest ? "Best Pick" : "Worst Pick"}
        </Typography>
      </Box>
      <Typography variant="h5" component="p" fontWeight="bold">
        {pick.full_name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Pick {pick.pick_no} ({pick.position} - {pick.team})
      </Typography>
      <Chip
        label={
          <Typography variant="body1" component="span">
            Draft Value:{" "}
            <strong>
              {pick.draft_value > 0 ? "+" : ""}
              {pick.draft_value.toFixed(2)}
            </strong>
          </Typography>
        }
        sx={{
          backgroundColor: isBest
            ? "rgba(46, 125, 50, 0.3)"
            : "rgba(211, 47, 47, 0.3)",
          color: isBest
            ? theme.palette.success.light
            : theme.palette.error.light,
          border: `1px solid ${color}`,
          mb: 1,
        }}
      />
      <Typography variant="caption" display="block" color="text.secondary">
        Achieved a Value Over Replacement of {pick.season_vor.toFixed(2)} vs. an
        expected {pick.expected_vor.toFixed(2)} for that draft slot.
      </Typography>
    </Box>
  );
};

export default function BestWorstPickCard({
  bestPickId,
  worstPickId,
}: BestWorstPickCardProps) {
  const [picks, setPicks] = useState<{
    best: DraftPick | null;
    worst: DraftPick | null;
  }>({ best: null, worst: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPicks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("draft_analysis")
        .select("*")
        .in("id", [bestPickId, worstPickId]);

      if (error || !data) {
        console.error("Error fetching best/worst picks:", error);
      } else {
        const best =
          (data.find((p) => p.id === bestPickId) as DraftPick) || null;
        const worst =
          (data.find((p) => p.id === worstPickId) as DraftPick) || null;
        setPicks({ best, worst });
      }
      setLoading(false);
    };

    fetchPicks();
  }, [bestPickId, worstPickId]);

  if (loading) {
    return <CircularProgress />;
  }

  if (!picks.best || !picks.worst) {
    return null; // Don't render if data is missing
  }

  return (
    <Paper
      elevation={3}
      sx={{ p: 3, backgroundColor: "rgba(17, 24, 39, 0.8)" }}
    >
      <Grid
        container
        spacing={2}
        divider={<Divider orientation="vertical" flexItem />}
      >
        <Grid item xs={12} md={6}>
          <PickDetail pick={picks.best} type="best" />
        </Grid>
        <Grid item xs={12} md={6}>
          <PickDetail pick={picks.worst} type="worst" />
        </Grid>
      </Grid>
    </Paper>
  );
}
