import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Container,
  Typography,
  Alert,
  Grid,
  Drawer,
  useTheme, // Added for consistency
  useMediaQuery, // Added for consistency
} from "@mui/material";
import AppHeader from "../components/AppHeader";
import BottomNavBar from "../components/BottomNavBar";
import DraftSelector from "../components/DraftSelector";
import PositionalValueChart from "../components/PositionalValueChart";
import BestWorstPickCard from "../components/BestWorstPickCard";
import ProfileOverview from "../components/ProfileOverview";
import PositionalInsights from "../components/PositionalInsights";
import RoundPhaseInsights from "../components/RoundPhaseInsights";
import StrategyBadges from "../components/StrategyBadges";
import supabase from "../integrations/supaclient";
import type { UserProfile, AnalyzedDraft, DraftAward } from "../models";


export default function ProfilePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get("userId");

  const getFantasyYear = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const seasonCutoff = new Date(currentYear, 7, 30);
    return today < seasonCutoff ? currentYear - 1 : currentYear;
  };
  const year = searchParams.get("year") || getFantasyYear();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzedDrafts, setAnalyzedDrafts] = useState<AnalyzedDraft[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!userId) {
      setError("User ID is required.");
      setLoading(false);
      return;
    }

    const fetchPageData = async () => {
      setLoading(true);
      setError(null);

      const { data: userDrafts, error: draftsError } = await supabase
        .from("user_drafts")
        .select("external_draft_id, user_display_name, league_name")
        .eq("user_id", userId);

      if (draftsError || !userDrafts) {
        // Handle error
      } else {
        const draftIds = userDrafts.map((d) => d.external_draft_id);
        const [queueRes, awardsRes] = await Promise.all([
          supabase
            .from("processing_queue")
            .select("external_draft_id, status")
            .in("external_draft_id", draftIds),
          supabase.from("draft_awards").select("*").in("draft_id", draftIds),
        ]);

        const combinedData = userDrafts.map((draft) => {
          const queueInfo = queueRes.data?.find(
            (q) => q.external_draft_id === draft.external_draft_id
          );
          const draftAwards =
            awardsRes.data?.filter(
              (aw) => aw.draft_id === draft.external_draft_id
            ) || [];

          return {
            draft_id: draft.external_draft_id,
            league_name: draft.league_name || "Unknown League",
            user_team_name: draft.user_display_name,
            analysis_status:
              (queueInfo?.status.toUpperCase() as AnalyzedDraft["analysis_status"]) || "QUEUED",
            awards: draftAwards,
          };
        });
        setAnalyzedDrafts(combinedData);
      }

      const { data: userData } = await supabase
        .from("users")
        .select("user_display_name")
        .eq("user_id", userId)
        .single();
      if (userData) setUserDisplayName(userData.user_display_name);

      const { data: profileData, error: dbError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .eq("year", parseInt(year.toString(), 10))
        .single();

      if (dbError) {
        setError("Could not load draft profile.");
        setProfile(null);
      } else {
        setProfile(profileData as UserProfile);
      }
      setLoading(false);
    };
    fetchPageData();
  }, [userId, year]);

  const handleSelectDraftOrMenu = (value: string) => {
    if (value === "show-all-reports") {
      setIsMobileMenuOpen(true);
    } else if (value === "profile-view") {
      return; 
    } else {
      navigate(`/awards?userId=${userId}&draftId=${value}`);
    }
  };

  const handleViewChange = (newView: "awards" | "datatable") => {
    navigate(`/awards?userId=${userId}&view=${newView}`);
  };

  const handleMobileMenuClose = () => setIsMobileMenuOpen(false);


  return (
      <Box
        sx={{
          position: "relative",
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          pb: { xs: 7, md: 0 },
        }}
      >
        <Box sx={{ display: { xs: "none", md: "flex" }, width: 288, flexShrink: 0 }}>
           <Drawer variant="permanent" sx={{ "& .MuiDrawer-paper": { width: 288, boxSizing: "border-box", bgcolor: "rgba(10, 14, 25, 0.5)", borderRight: "1px solid", borderColor: "rgba(0, 210, 255, 0.2)", backdropFilter: "blur(16px)" } }}>
            <DraftSelector
              drafts={analyzedDrafts}
              selectedDraftId={null} 
              onSelectDraft={handleSelectDraftOrMenu}
              userId={userId}
            />
          </Drawer>
        </Box>

         <Drawer
          open={isMobileMenuOpen}
          onClose={handleMobileMenuClose}
          sx={{ display: { xs: "block", md: "none" } }}
          PaperProps={{ sx: { width: "75%", bgcolor: "slate.900", borderRight: 1, borderColor: "cyan.500/30" } }}
        >
          <DraftSelector
            drafts={analyzedDrafts}
            selectedDraftId={null}
            onSelectDraft={(draftId) => {
              handleSelectDraftOrMenu(draftId);
              handleMobileMenuClose();
            }}
            userId={userId}
          />
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflowX: "hidden", width: "100%" }}>
          <AppHeader
            drafts={analyzedDrafts}
            selectedDraftId={null}
            onSelectDraftOrMenu={handleSelectDraftOrMenu}
            currentView="profile"
            onViewChange={handleViewChange}
            userId={userId}
          />
          <Container
            maxWidth="lg"
            sx={{
              py: 4,
              px: { xs: 3, sm: 4 },
              position: "relative",
              zIndex: 1,
              flexGrow: 1,
            }}
          >
            <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(to right, rgba(128, 128, 128, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(128, 128, 128, 0.07) 1px, transparent 1px)', backgroundSize: '24px 24px', zIndex: -1, top: '-120px' }} />
            <Box sx={{ position: 'absolute', left: 0, right: 0, top: 0, margin: 'auto', height: '310px', width: '310px', borderRadius: '50%', bgcolor: 'primary.main', opacity: 0.2, filter: 'blur(100px)', zIndex: -1, top: '-120px' }} />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : profile ? (
              <>
                <Typography variant={{ xs: 'h5', sm: 'h4', md: 'h3' }} component="h1" sx={{ textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.2em', textShadow: '0 0 8px rgba(0,255,255,0.5), 0 0 16px rgba(0,255,255,0.3)', mb: 4 }}>
                  {userDisplayName || userId} Draft Profile ({year})
                </Typography>
                <Grid container spacing={3} sx={{ width: "100%", m: 0 }}>
                  <Grid size={{ xs: 12 }}><ProfileOverview profile={profile} /></Grid>
                  <Grid size={{ xs: 12 }}><BestWorstPickCard bestPickId={profile.best_pick_id} worstPickId={profile.worst_pick_id} /></Grid>
                  <Grid size={{ xs: 12 }}><PositionalValueChart positionData={profile.position_data} /></Grid>
                  <Grid size={{ xs: 12 }}><PositionalInsights positionData={profile.position_data} /></Grid>
                  <Grid size={{ xs: 12 }}><RoundPhaseInsights roundPhaseData={profile.round_phase_data} /></Grid>
                  {profile.strategy_flags && <Grid size={{ xs: 12 }}><StrategyBadges strategyFlags={profile.strategy_flags} /></Grid>}
                </Grid>
              </>
            ) : null}
          </Container>
        </Box>
        <BottomNavBar
          userId={userId}
          currentView="profile"
          onViewChange={handleViewChange}
        />
      </Box>
  );
}
