import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

interface ProfileTeaserCardProps {
  userId?: string | null;
}

export default function ProfileTeaserCard({ userId }: ProfileTeaserCardProps) {
  const color = "#00f2ff"; // Using the 'Purist' neon cyan for consistency

  if (!userId) return null;

  return (
    <Card
      component={RouterLink}
      to={`/profile/${userId}`}
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        textDecoration: "none",
        // Glassmorphism & Glow styles from StrategyBadge
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(8px)",
        border: `1px solid ${color}`,
        boxShadow: `0 0 12px ${color}44`,
        borderRadius: 2,
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
          alignItems: "center",
          textAlign: "center",
          p: 3,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: "900",
            color: "white",
            mb: 1,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Drafting DNA
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "rgba(255, 255, 255, 0.7)",
            maxWidth: "280px",
            margin: "0 auto",
            mb: 2,
          }}
        >
          Curious about your overall drafting identity across all leagues?
        </Typography>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          sx={{
            mt: 1,
            backgroundColor: color,
            color: "black",
            fontWeight: "bold",
            "&:hover": {
              backgroundColor: "#fff",
            },
          }}
        >
          See All DNA Traits
        </Button>
      </CardContent>
    </Card>
  );
}
