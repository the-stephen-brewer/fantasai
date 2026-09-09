import {
  AppBar,
  Toolbar,
  Typography,
  Select,
  MenuItem,
  Box,
  type SelectChangeEvent,
  Chip,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PersonIcon from "@mui/icons-material/Person";
import type { AnalyzedDraft } from "../models";

interface AppHeaderProps {
  drafts: AnalyzedDraft[];
  selectedDraftId: string | null;
  onSelectDraftOrMenu: (value: string) => void;
  currentView: "awards" | "datatable" | "profile";
  userId?: string | null;
}

export default function AppHeader({
  drafts,
  selectedDraftId,
  onSelectDraftOrMenu,
  currentView,
  userId,
}: AppHeaderProps) {
  const selectValue =
    currentView === "profile" ? "profile-view" : selectedDraftId || "";

  return (
    <Box sx={{ display: { xs: "block", md: "none" } }}>
      <AppBar
        position="sticky"
        sx={{
          top: 0,
          bgcolor: "rgba(10, 14, 25, 0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid",
          borderColor: "rgba(0, 210, 255, 0.2)",
          zIndex: 1100,
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Select
            value={selectValue}
            onChange={(e: SelectChangeEvent<string>) =>
              onSelectDraftOrMenu(e.target.value)
            }
            variant="standard"
            disableUnderline
            sx={{
              color: "white",
              fontWeight: "bold",
              fontSize: "1.1rem",
              ".MuiSelect-icon": {
                color: "primary.main",
              },
            }}
          >
            <MenuItem value="profile-view">
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  alignItems: "center",
                }}
              >
                <PersonIcon sx={{ mr: 1 }} />
                <Typography variant="inherit" sx={{ fontWeight: "bold" }}>
                  My Drafting Identity
                </Typography>
              </Box>
            </MenuItem>
            {drafts.map((draft) => (
              <MenuItem key={draft.draft_id} value={draft.draft_id}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="inherit">{draft.league_name}</Typography>
                  <Chip
                    icon={<EmojiEventsIcon />}
                    label={draft.awards.length}
                    size="small"
                    sx={{
                      ml: 2,
                      bgcolor: "rgba(255,255,255,0.1)",
                      color: "white",
                    }}
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
