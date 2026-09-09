import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Tooltip,
} from "@mui/material";
import { keyframes } from "@emotion/react";
import ShieldIcon from "@mui/icons-material/Shield";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import GavelIcon from "@mui/icons-material/Gavel";
import ExploreIcon from "@mui/icons-material/Explore";
import type { StrategyFlags } from "../models";

// --- New "Identity Palette" ---
const IDENTITY_PALETTE = {
  Purist: "#00f2ff", // Neon Cyan
  Maverick: "#ff0055", // Hot Pink
  "Upside Chaser": "#bc13fe", // Neon Purple
  "Hero RB": "#ff9800", // Bright Orange
};

// --- Animation (unchanged) ---
const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

// --- Prop Interfaces ---
interface StrategyBadgeProps {
  icon: React.ReactNode;
  title: keyof typeof IDENTITY_PALETTE;
  description: string;
  tooltip: string;
}

interface StrategyBadgesProps {
  strategyFlags: StrategyFlags;
}

// --- Refactored StrategyBadge Component ---
const StrategyBadge = ({
  icon,
  title,
  description,
  tooltip,
}: StrategyBadgeProps) => {
  const color = IDENTITY_PALETTE[title];
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex", // Enable flexbox for centering
        flexDirection: "column", // Stack items vertically
        justifyContent: "center", // Center content vertically
        // Glassmorphism & Glow styles
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(8px)",
        border: `1px solid ${color}`,
        boxShadow: `0 0 12px ${color}44`,
        borderRadius: 2, // Standardized border radius
        // Animation & Hover
        animation: `${fadeIn} 0.5s ease-out`,
        transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 0 20px ${color}88`,
        },
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center", // Center content horizontally
          textAlign: "center",
          p: 3,
        }}
      >
        <Box sx={{ fontSize: 40, mb: 1.5, color }}>{icon}</Box>
        <Typography
          variant="h6"
          sx={{ fontWeight: "900", color: "white", mb: 0.5 }}
        >
          {title}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "rgba(255, 255, 255, 0.8)",
            maxWidth: "280px", // Constrain for readability
            margin: "0 auto",
            mb: 2, // Add margin bottom for spacing with the new tooltip text
          }}
        >
          {description}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontStyle: "italic",
            color: "rgba(255, 255, 255, 0.6)",
            maxWidth: "280px",
            margin: "0 auto",
          }}
        >
          {tooltip}
        </Typography>
      </CardContent>
    </Card>
  );
};

// --- Refactored Main Component ---
export default function StrategyBadges({ strategyFlags }: StrategyBadgesProps) {
  const badges: StrategyBadgeProps[] = [];

  // Logic to build badge data array
  if (strategyFlags?.hero_rb) {
    badges.push({
      icon: <ShieldIcon fontSize="inherit" />,
      title: "Hero RB",
      description:
        "You put all your eggs in one elite backfield basket. Bold move.",
      tooltip:
        "Triggered by taking exactly one RB in the first two rounds, then no more until at least Round 8.",
    });
  }

  if (strategyFlags?.asymmetric_upside_chaser) {
    badges.push({
      icon: <RocketLaunchIcon fontSize="inherit" />,
      title: "Upside Chaser",
      description:
        "Late-round rookies are your bread and butter. You're hunting for the next breakout superstar.",
      tooltip:
        "Triggered when over 25% of your picks from Round 10 onwards are rookies.",
    });
  }

  if (strategyFlags?.adp_slave) {
    const deviations = Object.values(strategyFlags.adp_slave).filter(
      (v): v is number => typeof v === "number",
    );
    if (deviations.length > 0) {
      const avgDeviation =
        deviations.reduce((acc, val) => acc + Math.abs(val), 0) /
        deviations.length;

      if (avgDeviation < 2.0) {
        badges.push({
          icon: <GavelIcon fontSize="inherit" />,
          title: "Purist",
          description: "You rarely stray from the draft board's path.",
          tooltip:
            "Your picks for QB, RB, WR, and TE are, on average, within 2 slots of their ADP.",
        });
      } else if (avgDeviation > 5.0) {
        badges.push({
          icon: <ExploreIcon fontSize="inherit" />,
          title: "Maverick",
          description:
            "You don't care what the experts think; you get your guys.",
          tooltip:
            "Your picks for QB, RB, WR, and TE are, on average, more than 5 slots away from their ADP.",
        });
      }
    }
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography
        variant="h4"
        component="h2"
        sx={{
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          mb: 3,
        }}
      >
        Your Drafting Identity
      </Typography>
      <Grid container spacing={2} alignItems="stretch" justifyContent="center">
        {badges.map((badge) => (
          <Grid size={{ xs: 12, sm: 6 }} sx={{ flexGrow: 1 }} key={badge.title}>
            <StrategyBadge {...badge} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
