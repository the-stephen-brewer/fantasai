import { ListItem, ListItemButton, ListItemText, ListItemIcon, CircularProgress, Box, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // Trophy Icon
import type { AnalyzedDraft } from '../routes/awards';

interface DraftSelectorItemProps {
  draft: AnalyzedDraft;
  isSelected: boolean;
  onClick: () => void;
}

export default function DraftSelectorItem({ draft, isSelected, onClick }: DraftSelectorItemProps) {
  const getStatusIcon = () => {
    switch (draft.analysis_status) {
      case 'ANALYZING':
        return <CircularProgress size={20} />;
      case 'COMPLETE':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'goldenrod' }}>
            <EmojiEventsIcon fontSize="small" />
            <Typography variant="caption" sx={{ ml: 0.5 }}>{draft.awards.length}</Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <ListItem disablePadding>
      <ListItemButton
        selected={isSelected}
        onClick={onClick}
        sx={{
          borderRadius: 1,
          mb: 0.5,
          borderLeft: isSelected ? '3px solid' : '3px solid transparent',
          borderColor: 'primary.main',
          background: isSelected 
            ? 'linear-gradient(to right, rgba(0, 210, 255, 0.15), transparent)' 
            : 'transparent',
          '&:hover': {
            background: 'linear-gradient(to right, rgba(0, 210, 255, 0.1), transparent)',
          }
        }}
      >
        <ListItemText
          primary={draft.league_name}
          secondary={draft.user_team_name}
        />
        <ListItemIcon sx={{ minWidth: 'auto' }}>{getStatusIcon()}</ListItemIcon>
      </ListItemButton>
    </ListItem>
  );
}