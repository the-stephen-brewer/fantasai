import { useState } from "react";
import type { Route } from "./+types/home";
import { useNavigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import supabase from "../integrations/supaclient";
import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Stack, // Import Stack component
  Card,
  CardContent,
  Link,
} from "@mui/material";
import { keyframes } from '@emotion/react';
import theme, { marqueeKeyframes } from "../theme"; // Import marqueeKeyframes
import TrophyCard from "../components/TrophyCard"; // Import TrophyCard
import type { DraftAward } from '../routes/awards'; // Import DraftAward type
import { ArrowUpward as ArrowUpwardIcon, Share as ShareIcon } from '@mui/icons-material';
import GradingIcon from '@mui/icons-material/Grading';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Fantasai Draft Analysis" },
    { name: "description", content: "Welcome to Fantasai!" },
  ];
}

const baseAwards: DraftAward[] = [
  {
    award_title: "The Reacher",
    award_description: "You reached for this player, taking them significantly earlier than their ADP. Sometimes it pays off, sometimes it doesn't.",
    user_display_name: "Mahomes Depot",
    award_context: "Cole Kmet (Taken Pick 4.02 vs ADP 9.08)",
    draft_id: "mock_draft_1",
    user_id: "mock_user_1"
  },
  {
    award_title: "Ryan Leaf Trophy",
    award_description: "This player was a bust. A big one. You spent high draft capital on a player who tanked your season.",
    user_display_name: "Maye Day Parade",
    award_context: "Austin Ekeler (Drafted Round 1 | Finished RB26)",
    draft_id: "mock_draft_1",
    user_id: "mock_user_2"
  },
  {
    award_title: "The Toilet Award",
    award_description: "This player was so bad, they belong in the toilet. Negative value all season long.",
    user_display_name: "FreshPrinceOfHelaire",
    award_context: "Miles Sanders (Total Season Points: 62.4)",
    draft_id: "mock_draft_1",
    user_id: "mock_user_3"
  },
  {
    award_title: "The Crystal Ball",
    award_description: "You saw the future! This player was a late-round gem who outperformed their ADP significantly.",
    user_display_name: "Kupp My Life",
    award_context: "Sam LaPorta (Drafted Rd 15 | Finished TE1)",
    draft_id: "mock_draft_1",
    user_id: "mock_user_4"
  },
  {
    award_title: "Sleeper God",
    award_description: "This player was an absolute steal! A true league-winner picked far below their value.",
    user_display_name: "Hurts So Good",
    award_context: "Kyren Williams (+18.5 PPG over projection)",
    draft_id: "mock_draft_1",
    user_id: "mock_user_5"
  }
];

// Mock data for awards, duplicated for the infinite scroll effect
const mockAwards: DraftAward[] = [...baseAwards, ...baseAwards];

// Ensure TrophyCard is imported and DraftAward type is available
// import TrophyCard from "../components/TrophyCard";
// import type { DraftAward } from '../routes/awards';

export default function Home() {

  const [username, setUsername] = useState("");
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFindDrafts = async () => {
    if (!username) {
      setError("Please enter a username.");
      return;
    }
    setLoading(true);
    setError(null);
    setUserData(null);

    try {
      const season = 2025;
      const userResponse = await fetch(`https://api.sleeper.app/v1/user/${username}`);
      const userData = await userResponse.json();

      if (!userData || !userData.user_id) {
        setError("Sleeper user not found.");
        setLoading(false);
        return;
      }
      setUserData(userData);

      const draftsResponse = await fetch(`https://api.sleeper.app/v1/user/${userData.user_id}/drafts/nfl/${season}`);
      const draftsData = await draftsResponse.json();

      if (draftsData && draftsData.length > 0) {
        const insertPromises = draftsData.map((draft: any) => 
          supabase
            .from('processing_queue')
            .insert({ 
              user_id: userData.user_id, 
              external_draft_id: draft.draft_id,
              platform_name: 'sleeper',
              status: 'queued'
            })
        );

        const results = await Promise.all(insertPromises);
        const anyError = results.some(res => res.error);

        if (anyError) {
          // A more robust implementation might collect all errors
          setLoading(false);
          setError(`Error queuing one or more drafts for analysis.`);
        } else {
          navigate(`/awards?userId=${userData.user_id}`);
        }
      } else {
        setError(`No drafts found for ${username} in the ${season} season.`);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
    }
  }

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        // Ensure the outermost Box handles the background and overflow
        overflow: 'hidden', // Ensures glow doesn't create scrollbars
        bgcolor: 'background.default',
      }}>
        {/* 1. The "Cyber Grid" Overlay */}
        <Box sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(to right, rgba(128, 128, 128, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(128, 128, 128, 0.07) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          zIndex: 0,
        }} />

        {/* 2. The Top "Glow" Spotlight */}
        <Box sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          margin: 'auto',
          height: '310px',
          width: '310px',
          borderRadius: '50%',
          bgcolor: 'primary.main',
          opacity: 0.2,
          filter: 'blur(100px)',
          zIndex: 0,
        }} />

        {/* All Page Content Goes Here */}
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}> {/* This Container wraps all main page content */}
          <Box sx={{ 
            my: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            textAlign: 'center',
            p: 4,
            // Add text shadow/glow to the header
            textShadow: '0 0 8px rgba(0,255,255,0.5), 0 0 16px rgba(0,255,255,0.3)',
          }}>
            <Typography variant="h2" component="h1" sx={{
              textTransform: 'uppercase',
              mb: 2,
              fontFamily: '"Russo One", "Montserrat", "Roboto", sans-serif', // Apply display font
            }}>
              STOP GUESSING. START DOMINATING.
            </Typography>
          <Typography color="text.secondary" sx={{ mb: 4, maxWidth: '600px' }}>
            AI-powered analytics that roast your drafts, praise your picks, and uncover the betting habits costing you money.
          </Typography>
          <TextField
            id="sleeper-username"
            label="Sleeper Username"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            onKeyDown={(e) => e.key === 'Enter' && handleFindDrafts()}
            sx={{ maxWidth: '400px' }}
            helperText="Enter your sleeper username to get started"
          />
          <Button 
            variant="contained" 
            color="secondary"
            sx={{ mt: 3, py: 1.5, px: 5, color: 'black', fontWeight: 'bold' }} 
            onClick={handleFindDrafts} 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "ANALYZE MY PERFORMANCE"}
          </Button>
        </Box>
        {/* End of main hero Box */}

        {/* New Awards Section Container */}
        <Box sx={{
          py: 5, // Vertical padding (equivalent to py-20)
          bgcolor: 'rgba(15, 23, 42, 0.8)', // bg-slate-950/80
          position: 'relative',
          zIndex: 1,
          mt: 8, // Margin top to separate from previous section
          width: '100vw', // Ensure it spans full width
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
        }}>
          {/* Top Divider */}
          <Box sx={{
            height: '1px',
            background: `linear-gradient(to right, transparent, ${theme.palette.primary.main}80 10%, ${theme.palette.primary.main}80 90%, transparent)`,
            mb: 8, // Margin bottom for separation from header
          }} />

          {/* Header for Marquee Section */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" component="h2" sx={{
              textTransform: 'uppercase',
              fontWeight: 700,
              fontFamily: '"Russo One", "Montserrat", "Roboto", sans-serif',
              letterSpacing: '0.2em', // tracking-widest
              color: 'white',
              textShadow: '0 0 5px rgba(255,255,255,0.5), 0 0 10px rgba(255,255,255,0.3), 0 0 15px rgba(255,255,255,0.1)',
              mb: 1,
            }}>
              THE HALL OF FAME & SHAME
            </Typography>
            <Typography color={theme.palette.grey[400]} sx={{ maxWidth: '600px', margin: '0 auto' }}>
              From late-round genius steals to season-ending busts, our AI uncovers the truth behind every pick. Here is a preview of the hardware waiting for you.
            </Typography>
          </Box>

        {/* Marquee Section */}
        <Box sx={{
          overflow: 'hidden',
          position: 'relative',
          width: '100vw', // Use viewport width to be full-width
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          py: 4, // Add some vertical padding
          // Gradient mask
          maskImage: `linear-gradient(to right, transparent, black 10%, black 90%, transparent)`,
          WebkitMaskImage: `linear-gradient(to right, transparent, black 10%, black 90%, transparent)`,
        }}>
          <Box sx={{
            display: 'flex',
            width: '200%', // Double the width to allow for seamless looping
            animation: `${marqueeKeyframes} 30s linear infinite`, // Use the keyframes defined in theme.ts
            '&:hover': {
              animationPlayState: 'paused', // Pause on hover
            },
            gap: 6, // Space between cards (gap-6)
          }}>
            {mockAwards.map((award, index) => (
              <Box key={index} sx={{ flexShrink: 0, width: '300px' }}> {/* Fixed width for cards */}
                <TrophyCard award={award} />
              </Box>
            ))}
          </Box>
        </Box>
        </Box> {/* End of New Awards Section Container */}

        {/* Dual-Engine Feature Section */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ my: 8 }}>
          {/* Fantasy Card */}
          <Box sx={{ flex: 1 }}>
            <Card sx={{ height: '100%', width: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <GradingIcon sx={{ fontSize: 70, color: 'primary.main', mr: 0.75 }} />
                  <Typography variant="h5" component="h3" sx={{ textTransform: 'uppercase' }}>
                    DRAFT HINDSIGHT 20/20
                  </Typography>
                </Box>
                <Typography color="text.secondary" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                  Find trends and get tips for next season based on your actual data.
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Betting Card */}
          <Box sx={{ flex: 1 }}>
            <Card sx={{ height: '100%', width: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <AutoGraphIcon sx={{ fontSize: 70, color: 'primary.main', mr: 0.75 }} />
                  <Typography variant="h5" component="h3" sx={{ textTransform: 'uppercase' }}>
                    THE SPORTSBOOK AUDIT
                  </Typography>
                </Box>
                <Typography color="text.secondary" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                  Sync history, find leaks, and stop donating to the books.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Stack>

        {/* Social Proof Section */}
        <Container maxWidth="sm" sx={{ my: 8, textAlign: 'center', position: 'relative' }}>
          <Typography variant="h2" component="h2" sx={{
            textTransform: 'uppercase',
            mb: 4,
            fontFamily: '"Russo One", "Montserrat", "Roboto", sans-serif', // Apply display font
            textShadow: '0 0 8px rgba(0,255,255,0.5), 0 0 16px rgba(0,255,255,0.3)', // Text glow
          }}>
            SETTLE THE DEBATE.
          </Typography>

          {/* Spotlight Effect behind the phone */}
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px', // Larger than phone
            height: '400px', // Larger than phone
            background: 'radial-gradient(circle, rgba(0,255,255,0.2) 0%, rgba(0,255,255,0) 70%)',
            filter: 'blur(3rem)',
            borderRadius: '50%',
            zIndex: 0,
          }} />

          {/* Mock iPhone Container */}
          <Box sx={{
            width: 300,
            height: 450,
            border: '10px solid #333',
            borderRadius: '40px',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)', // Original shadow
            filter: 'drop-shadow(0 25px 25px rgba(0, 0, 0, 0.75))', // Realistic drop shadow (drop-shadow-2xl equivalent)
            position: 'relative',
            mx: 'auto',
            backgroundColor: '#0f172a', // Screen background
            zIndex: 1, // Ensure phone is above the spotlight
          }}>
            {/* Notch */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '120px',
              height: '20px',
              backgroundColor: '#333',
              borderRadius: '0 0 10px 10px',
            }} />
            <img src="/phoneSample.jpg" style={{ display: 'block', width: '100%', height: 'auto' }} />

            {/* Floating Chat Bubble 1 (Top Left) */}
            <Box sx={{
              position: 'absolute',
              top: '10%',
              left: '5%',
              bgcolor: 'slate.800',
              color: 'text.secondary',
              borderRadius: '1rem',
              p: 1.5,
              fontSize: '0.875rem', // text-sm
              transform: 'rotate(-5deg)',
              filter: 'blur(0.5px)', // Subtle blur
              opacity: 0.9,
            }}>
              There's no way you got an A grade...
            </Box>

            {/* Floating Chat Bubble 2 (Bottom Right) */}
            <Box sx={{
              position: 'absolute',
              bottom: '10%',
              right: '5%',
              bgcolor: 'info.main', // Blue background
              color: 'white',
              borderRadius: '1rem',
              p: 1.5,
              fontSize: '0.875rem', // text-sm
              transform: 'rotate(5deg)',
            }}>
              Read it and weep. 📉
            </Box>
          </Box>

          {/* Share Call-to-Action */}
          <Button
            variant="text"
            color="primary"
            sx={{
              mt: 4,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              animation: `${keyframes`
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
              `} 1.5s infinite ease-in-out`,
              '&:hover': {
                animationPlayState: 'paused',
              },
            }}
            startIcon={<ShareIcon />}
            onClick={() => alert('Share functionality coming soon!')} // Placeholder for share action
          >
            Share to League Chat
          </Button>
        </Container>

        {/* Footer */}
        <Box component="footer" sx={{
          textAlign: 'center',
          py: 6,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <Typography variant="h6" component="p" sx={{ mb: 3 }}>
            Ready to see your stats?{' '}
            <Link component="button" onClick={handleScrollToTop} sx={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
              Scroll to Top <ArrowUpwardIcon sx={{ ml: 0.5 }} fontSize="small" />
            </Link>
          </Typography>
          <Grid container justifyContent="center" alignItems="center" spacing={4}>
            {['Sleeper', 'FanDuel', 'DraftKings'].map((platform) => (
              <Grid item key={platform}>
                <Typography
                  sx={{
                    opacity: 0.6,
                    filter: 'grayscale(1)',
                  }}
                >{platform}</Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
        </Container> {/* Closing tag for the main content wrapper Container */}
      </Box> {/* Closing tag for the outermost background Box */}
    </ThemeProvider>
  );
}
