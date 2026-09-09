import { useState } from "react";
import {
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import { generateBragText } from "../utils/generateBragText";

interface ShareButtonProps {
  currentUserDisplayName?: string | null;
  userDisplayName?: string | null;
  leagueName?: string | null;
  awardName?: string | null;
  awardDescription?: string | null;
  awardContext?: string | null;
  draftGrade?: string | null;
  draftValue?: number | null;
}

export default function ShareButton(props: ShareButtonProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const bragText = generateBragText(props);
    const shareUrl = window.location.origin; // Root URL of the site

    try {
      // First, always try to copy to clipboard
      await navigator.clipboard.writeText(bragText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds

      // Then, if on mobile, also trigger the native share sheet
      if (navigator.share && isMobile) {
        await navigator.share({
          title: "DraftEdge - Fantasy Football Draft Analysis",
          text: bragText,
          url: shareUrl,
        });
      }
    } catch (error) {
      console.error("Failed to share or copy:", error);
      // Fallback for older browsers
      alert("Could not copy to clipboard. Please copy the text manually.");
    }
  };

  return (
    <Tooltip title={copied ? "Copied!" : "Share"} placement="top">
      <IconButton onClick={handleShare} size="small">
        <ShareIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
