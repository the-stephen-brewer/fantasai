import { BarChart } from "@mui/x-charts/BarChart";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import type { UserProfile } from "../models";
import { axisClasses } from "@mui/x-charts/ChartsAxis";

interface PositionalValueChartProps {
  positionData: UserProfile["position_data"];
}

const chartSetting = {
  height: 350,
  slotProps: {
    legend: {
      labelStyle: {
        // Use the theme's text color for legend labels
        fill: "white",
      },
      itemMarkWidth: 0, // Remove default color squares
      itemMarkHeight: 0,
    },
  },
  sx: {
    [`.${axisClasses.left} .${axisClasses.label}`]: {
      fill: "white", // Y-axis label color
    },
    [`.${axisClasses.bottom} .${axisClasses.tickLabel}`]: {
      fill: "white", // X-axis tick labels
    },
  },
};

const positionOrder = ["QB", "RB", "WR", "TE", "K"];

export default function PositionalValueChart({
  positionData,
}: PositionalValueChartProps) {
  const theme = useTheme();

  // Filter out positions the user didn't draft and sort them
  const labels = positionOrder.filter(
    (pos) => positionData[pos as keyof typeof positionData],
  );

  if (labels.length === 0) {
    return null; // Don't render the chart if there's no data
  }

  const userData = labels.map(
    (pos) =>
      positionData[pos as keyof typeof positionData]?.avg_draft_value ?? 0,
  );
  const leagueData = labels.map(
    (pos) =>
      positionData[pos as keyof typeof positionData]?.league_avg_draft_value ??
      0,
  );

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: "1rem", // rounded-xl
        backgroundColor: "background.paper",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 0 20px rgba(0, 210, 255, 0.5)",
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        Positional Value vs. League
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        This chart compares the average Draft Value you achieved for each
        position against the league average. Positive bars indicate you found
        more value than your leaguemates; negative bars indicate you reached.
      </Typography>
      <Box sx={{ width: "100%" }}>
        <BarChart
          dataset={labels.map((label, i) => ({
            position: label,
            user: userData[i],
            league: leagueData[i],
          }))}
          yAxis={[
            { label: "Average Draft Value", labelStyle: { fill: "white" } },
          ]}
          xAxis={[
            {
              scaleType: "band",
              dataKey: "position",
              tickLabelStyle: { fill: "white" },
            },
          ]}
          series={[
            {
              dataKey: "user",
              label: "Your Value",
              color: theme.palette.primary.main, // Neon Cyan for user
              // Custom value formatter to add a '+' for positive numbers
              valueFormatter: (value) =>
                value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2),
            },
            {
              dataKey: "league",
              label: "League Avg Value",
              color: theme.palette.grey[700], // Slate Gray for league
              valueFormatter: (value) =>
                value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2),
            },
          ]}
          {...chartSetting}
        />
      </Box>
    </Paper>
  );
}
