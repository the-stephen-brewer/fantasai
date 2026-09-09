import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Divider, Container, FormControlLabel, Switch, useTheme, ButtonBase, Tooltip } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Link as RouterLink } from 'react-router-dom';
import type { AnalyzedDraft, DraftAward } from '../models'; // Import DraftAward
import TrophyCard from '../components/TrophyCard';
import { awardConfig } from './awardConfig';
import ProfileTeaserCard from './ProfileTeaserCard';

interface AwardsDisplayProps {
  selectedDraft: AnalyzedDraft | null;
  userId?: string | null;
}

export default function AwardsDisplay({ selectedDraft, userId }: AwardsDisplayProps) {
  const [showMyAwardsOnly, setShowMyAwardsOnly] = useState(false);
  const [showProfileTeaser, setShowProfileTeaser] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowProfileTeaser(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [selectedDraft]);

  if (!selectedDraft) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="h6" color="text.secondary">
          Select a draft from the list to view your awards.
        </Typography>
      </Box>
    );
  }
  
  // ... other loading/error states ...

  const groupOrder: (keyof typeof groupDescriptions)[] = ['Hall of Fame', 'Hall of Shame',  'Bests and Worsts','Draft Strategy', 'Curiosities'];

  const groupDescriptions = {
    'Hall of Fame': 'The best of the best. These awards celebrate your most brilliant picks and moments of draft genius.',
    'Hall of Shame': 'We all make mistakes. These awards highlight the picks that... could have gone better.',
    'Bests and Worsts': 'Every league members best and worst picks of the draft. Celebrate the highs and lows.',
    'Draft Strategy': 'Every manager has a plan. This section recognizes your unique approach to building a team.',
    'Curiosities': 'Sometimes, the draft is just weird. These awards are for the interesting, odd, and luck-based outcomes.',
  };

  const awardsToDisplay = showMyAwardsOnly
    ? selectedDraft.awards.filter(award => award.user_display_name === selectedDraft.user_team_name)
    : selectedDraft.awards;

  const groupedAwards = awardsToDisplay.reduce((acc, award) => {
    const group = awardConfig[award.award_title]?.group || 'Curiosities';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(award);
    return acc;
  }, {} as Record<string, DraftAward[]>);

  const groupStyles = {
    'Hall of Fame': { color: theme.palette.secondary.main, textShadow: `0 0 12px ${theme.palette.secondary.main}` },
    'Hall of Shame': { color: theme.palette.error.main, textShadow: `0 0 12px ${theme.palette.error.main}` },
    'Bests and Worsts': { color: theme.palette.primary.light, textShadow: `0 0 8px ${theme.palette.primary.light}` },
    'Draft Strategy': { color: theme.palette.primary.light, textShadow: `0 0 8px ${theme.palette.primary.light}` },
    'Curiosities': { color: theme.palette.grey[400], textShadow: `0 0 8px ${theme.palette.grey[400]}` }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: { xs: 'center', md: 'space-between' }, mb: 4 }}>
        <Typography variant="h3" component="h1" sx={{ textTransform: 'uppercase', textShadow: '0 0 8px rgba(255, 255, 255, 0.3)', fontSize: { xs: '1.5rem', md: '2.25rem', lg: '3rem' }, textAlign: 'center' }}>
          {selectedDraft.league_name} - Awards
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: { xs: 2, md: 0 } }}>
          <FormControlLabel
            control={<Switch color="primary" checked={showMyAwardsOnly} onChange={(e) => setShowMyAwardsOnly(e.target.checked)} />}
            label={<Typography variant="caption">My Awards Only</Typography>}
          />
          {userId && (
            <Tooltip title="View Aggregate Draft Profile">
              <ButtonBase component={RouterLink} to={`/profile?userId=${userId}`} sx={{ px: 2, py: 1, borderRadius: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', transition: 'transform 0.2s ease-in-out', '&:hover': { transform: 'translateY(-2px)', backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{selectedDraft.user_team_name}</Typography>
              </ButtonBase>
            </Tooltip>
          )}
        </Box>
      </Box>

      {groupOrder.map(groupName => (
        groupedAwards[groupName] && (
          <Box key={groupName} sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', mb: 3 }}>
              <Divider sx={{ flexGrow: 1, mr: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
              <Typography variant="h5" component="h2" sx={{ ...groupStyles[groupName], textTransform: 'uppercase', letterSpacing: '0.1em' }}>{groupName}</Typography>
              <Divider sx={{ flexGrow: 1, ml: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
            </Box>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '700px', margin: '0 auto' }}>{groupDescriptions[groupName]}</Typography>
            </Box>
            <Grid container spacing={3} alignItems="stretch">
              {groupedAwards[groupName].map((award, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`${award.award_title}-${award.user_display_name}-${index}`} sx={{ display: 'flex' }}>
                  <TrophyCard award={award} leagueName={selectedDraft.league_name} currentUserDisplayName={selectedDraft.user_team_name} />
                </Grid>
              ))}
              {groupName === 'Hall of Shame' && showProfileTeaser && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex' }}>
                  <ProfileTeaserCard userId={userId} />
                </Grid>
              )}
            </Grid>
          </Box>
        )
      ))}
    </Container>
  );
}
