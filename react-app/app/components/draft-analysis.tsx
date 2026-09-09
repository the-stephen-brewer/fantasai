import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, ThemeProvider, CssBaseline, Container } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import theme from '../theme';
import supabase from '../integrations/supaclient';
import type { DraftAnalysis } from './models';

const columns: GridColDef<DraftAnalysis>[] = [
  { field: 'pick_no', headerName: 'Pick', width: 70, type: 'number' },
  { field: 'round', headerName: 'Rnd', width: 70, type: 'number' },
  { field: 'full_name', headerName: 'Player', width: 180 },
  { field: 'position', headerName: 'Pos', width: 70 },
  { field: 'team', headerName: 'Team', width: 70 },
  { field: 'display_name', headerName: 'Manager', width: 150 },
  {
    field: 'draft_value',
    headerName: 'Draft Value',
    width: 120,
    type: 'number',
    valueFormatter: (value) => (value != null ? value.toFixed(2) : ''),
    description: 'Value Over Replacement (VOR) minus Expected VOR for that draft slot.',
  },
  {
    field: 'season_vor',
    headerName: 'Season VOR',
    width: 120,
    type: 'number',
    valueFormatter: (value) => (value != null ? value.toFixed(2) : ''),
    description: 'Player\'s total Value Over Replacement for the season.',
  },
  {
    field: 'expected_vor',
    headerName: 'Expected VOR',
    width: 130,
    type: 'number',
    valueFormatter: (value) => (value != null ? value.toFixed(2) : ''),
    description: 'The historical average VOR for this draft pick number.',
  },
  {
    field: 'ecr',
    headerName: 'ECR',
    width: 70,
    type: 'number',
    description: 'Expert Consensus Rank (Pre-draft)',
  },
  {
    field: 'adp_delta',
    headerName: 'Reach/Value',
    width: 120,
    type: 'number',
    valueFormatter: (value) => (value != null ? value.toFixed(2) : ''),
    description: 'Difference between pick number and ECR. Negative is a reach, positive is a value.',
  },
  { field: 'age', headerName: 'Age', width: 70, type: 'number' },
];

export default function DraftAnalysisPage() {
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draftId');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<DraftAnalysis[]>([]);
  const [draftName, setDraftName] = useState<string>('Draft');

  useEffect(() => {
    if (!draftId) {
      setError("No draft ID provided.");
      setLoading(false);
      return;
    }
 
    const fetchDraftData = async () => {
      setLoading(true);
      setError(null);
 
      const [draftDetails, analysis] = await Promise.all([
        supabase
          .from('user_drafts')
          .select('league_name')
          .eq('external_draft_id', draftId)
          .single(),
        supabase
          .from('draft_analysis')
          .select('*')
          .eq('draft_id', draftId)
          .order('pick_no', { ascending: true }),
      ]);
 
      if (draftDetails.error) {
        setError(`Could not load draft name: ${draftDetails.error.message}`);
      } else if (draftDetails.data) {
        setDraftName(draftDetails.data.league_name);
      }
 
      if (analysis.error) {
        setError(`Could not load draft analysis: ${analysis.error.message}`);
      } else if (analysis.data) {
        setAnalysisData(analysis.data as DraftAnalysis[]);
      }
 
      setLoading(false);
    };
 
    fetchDraftData();
  }, [draftId]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Deep Dive Analysis for {draftName}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          A pick-by-pick breakdown of your draft, comparing each selection against historical performance and expert consensus.
        </Typography>

        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && (
          <Box sx={{ height: '75vh', width: '100%', backgroundColor: 'background.paper' }}>
            <DataGrid
              rows={analysisData}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 100,
                  },
                },
              }}
              pageSizeOptions={[25, 50, 100]}
              disableRowSelectionOnClick
            />
          </Box>
        )}
      </Container>
    </ThemeProvider>
  );
}