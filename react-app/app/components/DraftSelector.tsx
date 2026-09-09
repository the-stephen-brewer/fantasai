import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "@mui/material";
import { NavLink } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import type { AnalyzedDraft } from "../models";
import DraftSelectorItem from "../components/DraftSelectorItem";

interface DraftSelectorProps {
  drafts: AnalyzedDraft[];
  selectedDraftId: string | null;
  onSelectDraft: (draftId: string) => void;
  userId?: string | null;
}

export default function DraftSelector({
  drafts,
  selectedDraftId,
  onSelectDraft,
  userId,
}: DraftSelectorProps) {
  return (
    <Box
      sx={{
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontFamily: '"Russo One", "Montserrat", "Roboto", sans-serif',
          textAlign: "center",
          color: "primary.main",
          textShadow: "0 0 8px rgba(0, 210, 255, 0.5)",
          mb: 2,
        }}
      >
        DraftEdge
      </Typography>

      <List component="nav" subheader={<li />}>
        <ListSubheader
          sx={{ bgcolor: "transparent", textTransform: "uppercase" }}
        >
          Global
        </ListSubheader>
        {userId && (
          <ListItem component={NavLink} to={`/profile?userId=${userId}`} disablePadding>
            <ListItemButton
              sx={{
                borderRadius: 1,
                "&.active": {
                  backgroundColor: "primary.main",
                  "& .MuiTypography-root, & .MuiSvgIcon-root": {
                    color: "black",
                    fontWeight: "bold",
                  },
                },
              }}
            >
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="My Drafting Identity" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
      <List component="nav" sx={{ overflowY: "auto", flexGrow: 1 }} subheader={<li />}>
        <ListSubheader
          sx={{ bgcolor: "transparent", textTransform: "uppercase" }}
        >
          Your Reports
        </ListSubheader>
        {drafts.map((draft) => (
          <DraftSelectorItem
            key={draft.draft_id}
            draft={draft}
            isSelected={selectedDraftId === draft.draft_id}
            onClick={() => onSelectDraft(draft.draft_id)}
          />
        ))}
      </List>
    </Box>
  );
}