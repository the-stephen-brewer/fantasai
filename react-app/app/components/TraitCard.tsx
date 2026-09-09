import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { Info } from "@mui/icons-material";
import React from "react";

// Define the props for the TraitCard component
interface TraitCardProps {
  title: string;
  value: React.ReactNode;
  unit?: string;
  tooltip: string;
  compressed?: boolean;
}

/**
 * A reusable card component to display a user profile trait.
 * It's designed to be flexible and fit within a grid system.
 */
export const TraitCard: React.FC<TraitCardProps> = ({
  title,
  value,
  unit,
  tooltip,
  compressed = false,
}) => {
  const isChip = React.isValidElement(value) && value.type === Chip;

  return (
    <Box
      sx={{
        background: "rgba(18, 20, 32, 0.7)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: 2,
        p: compressed ? 1 : 2,
        height: "100%",
        minHeight: compressed ? 80 : 110, // Standardize min-height
        display: "flex",
        flexDirection: "column", // Stack items vertically
        justifyContent: "center", // Center vertically
        alignItems: "center", // Center horizontally
        textAlign: "center",
        position: "relative",
      }}
    >
      <Tooltip title={tooltip} placement="top">
        <Info
          sx={{
            fontSize: compressed ? 12 : 14,
            color: "text.secondary",
            opacity: 0.7,
            position: "absolute",
            top: 8,
            right: 8,
          }}
        />
      </Tooltip>
      <Typography
        variant={compressed ? "caption" : "body2"}
        sx={{ color: "text.secondary", textTransform: "uppercase", order: 2 }} // Ensure title is below value
      >
        {title}
      </Typography>
      <Box sx={{ order: 1 }}>
        {" "}
        {/* Wrapper for value and unit */}
        {isChip ? (
          value
        ) : (
          <Typography
            variant={compressed ? "h6" : "h4"}
            component="p"
            sx={{ fontWeight: "bold", lineHeight: 1.2 }}
          >
            {value}
            {unit && (
              <Typography
                component="span"
                variant={compressed ? "caption" : "body2"}
                sx={{ ml: 0.5, color: "text.secondary", fontWeight: "normal" }}
              >
                {unit}
              </Typography>
            )}
          </Typography>
        )}
      </Box>
    </Box>
  );
};