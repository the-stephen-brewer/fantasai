import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Drawer,
  Switch,
  FormControlLabel,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  useMediaQuery,
  useTheme,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import DraftSelector from "../components/DraftSelector";
import AwardsDisplay from "../components/AwardsDisplay";
import MobileDraftCard from "../components/MobileDraftCard";
import supabase from "../integrations/supaclient";
import type { DraftAnalysis, AnalyzedDraft, DraftAward } from "../models";
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";
import AppHeader from "../components/AppHeader";
import BottomNavBar from "../components/BottomNavBar";

const columns: GridColDef<DraftAnalysis>[] = [
  { field: "pick_no", headerName: "Pick", width: 70, type: "number" },
  { field: "round", headerName: "Rnd", width: 70, type: "number" },
  { field: "full_name", headerName: "Player", width: 180 },
  { field: "position", headerName: "Pos", width: 70 },
  { field: "team", headerName: "Team", width: 70 },
  { field: "display_name", headerName: "Manager", width: 150 },
  {
    field: "draft_value",
    headerName: "Draft Value",
    width: 130,
    type: "number",
    renderCell: (params) => {
      const value = params.value as number;
      if (value == null) return "";
      const color =
        value > 0
          ? "success.main"
          : value < 0
            ? "error.main"
            : "text.secondary";
      const Icon =
        value > 0 ? ArrowUpwardIcon : value < 0 ? ArrowDownwardIcon : null;
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            color,
            fontWeight: "bold",
          }}
        >
          {Icon && <Icon sx={{ fontSize: "1rem", mr: 0.5 }} />}
          {value.toFixed(2)}
        </Box>
      );
    },
    renderHeader: (params) => (
      <Tooltip title="Value Over Replacement (VOR) minus Expected VOR for that draft slot.">
        <Typography
          component="span"
          sx={{ textDecoration: "underline dotted", cursor: "help" }}
        >
          {params.colDef.headerName}
        </Typography>
      </Tooltip>
    ),
  },
  {
    field: "season_vor",
    headerName: "Season VOR",
    width: 120,
    type: "number",
    valueFormatter: (value) => (value != null ? value.toFixed(2) : ""),
    renderHeader: (params) => (
      <Tooltip title="Value Over Replacement: How many points this player scored compared to a waiver wire replacement.">
        <Typography
          component="span"
          sx={{ textDecoration: "underline dotted", cursor: "help" }}
        >
          {params.colDef.headerName}
        </Typography>
      </Tooltip>
    ),
  },
  {
    field: "expected_vor",
    headerName: "Expected VOR",
    width: 130,
    type: "number",
    valueFormatter: (value) => (value != null ? value.toFixed(2) : ""),
    renderHeader: (params) => (
      <Tooltip title="The historical average VOR for this draft pick number.">
        <Typography
          component="span"
          sx={{ textDecoration: "underline dotted", cursor: "help" }}
        >
          {params.colDef.headerName}
        </Typography>
      </Tooltip>
    ),
  },
  {
    field: "ecr",
    headerName: "ECR",
    width: 70,
    type: "number",
    renderHeader: (params) => (
      <Tooltip title="Expert Consensus Ranking: Where experts thought this player should go.">
        <Typography
          component="span"
          sx={{ textDecoration: "underline dotted", cursor: "help" }}
        >
          {params.colDef.headerName}
        </Typography>
      </Tooltip>
    ),
  },
  {
    field: "adp_delta",
    headerName: "Reach/Value",
    width: 130,
    type: "number",
    renderCell: (params) => {
      const value = params.value as number;
      if (value == null) return "";
      const color =
        value < 0
          ? "success.main"
          : value > 0
            ? "error.main"
            : "text.secondary";
      const Icon =
        value < 0 ? ArrowUpwardIcon : value > 0 ? ArrowDownwardIcon : null;
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            color,
            fontWeight: "bold",
          }}
        >
          {Icon && <Icon sx={{ fontSize: "1rem", mr: 0.5 }} />}
          {value.toFixed(2)}
        </Box>
      );
    },
    renderHeader: (params) => (
      <Tooltip title="The difference between where you picked them and their ECR.">
        <Typography
          component="span"
          sx={{ textDecoration: "underline dotted", cursor: "help" }}
        >
          {params.colDef.headerName}
        </Typography>
      </Tooltip>
    ),
  },
  { field: "age", headerName: "Age", width: 70, type: "number" },
];

export default function DraftReportPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [showRotateTip, setShowRotateTip] = useState(false);
  const [analyzedDrafts, setAnalyzedDrafts] = useState<AnalyzedDraft[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get("userId");

  const [view, setView] = useState<"awards" | "datatable">("awards");
  const [analysisData, setAnalysisData] = useState<DraftAnalysis[]>([]);
  const [isAnalysisLoading, setAnalysisLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMyPicksOnly, setShowMyPicksOnly] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setShowRotateTip(window.innerHeight > window.innerWidth);
    };
    if (isMobile) {
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    } else {
      setShowRotateTip(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!userId) {
      setError("No user ID provided.");
      setLoading(false);
      return;
    }

    const fetchDraftData = async () => {
      const { data: userDrafts, error: draftsError } = await supabase
        .from("user_drafts")
        .select("external_draft_id, user_display_name, league_name")
        .eq("user_id", userId);

      if (draftsError || !userDrafts) {
        setLoading(false);
        return;
      }

      const draftIds = userDrafts.map((d) => d.external_draft_id);
      const [queueRes, awardsRes] = await Promise.all([
        supabase
          .from("processing_queue")
          .select("external_draft_id, status")
          .in("external_draft_id", draftIds),
        supabase.from("draft_awards").select("*").in("draft_id", draftIds),
      ]);

      if (queueRes.error || awardsRes.error) {
        return;
      }

      const combinedData = userDrafts.map((draft) => {
        const queueInfo = queueRes.data?.find(
          (q) => q.external_draft_id === draft.external_draft_id,
        );
        const draftAwards =
          awardsRes.data?.filter(
            (aw) => aw.draft_id === draft.external_draft_id,
          ) || [];

        return {
          draft_id: draft.external_draft_id,
          league_name: draft.league_name || "Unknown League",
          user_team_name: draft.user_display_name,
          analysis_status:
            (queueInfo?.status.toUpperCase() as AnalyzedDraft["analysis_status"]) ||
            "QUEUED",
          awards: draftAwards,
        };
      });

      setAnalyzedDrafts(combinedData);
      setLoading(false);
    };

    fetchDraftData();
    const intervalId = setInterval(fetchDraftData, 5000);
    return () => clearInterval(intervalId);
  }, [userId]);

  useEffect(() => {
    if (analyzedDrafts.length > 0 && !selectedDraftId) {
      const urlDraftId = searchParams.get("draftId");
      const validDraftId =
        urlDraftId && analyzedDrafts.some((d) => d.draft_id === urlDraftId)
          ? urlDraftId
          : analyzedDrafts[0]?.draft_id;

      if (validDraftId) {
        setSelectedDraftId(validDraftId);
      }
    }
    const urlView = searchParams.get("view");
    if (urlView === "datatable" || urlView === "awards") {
      setView(urlView);
    }
  }, [analyzedDrafts, selectedDraftId, searchParams]);

  useEffect(() => {
    if (!selectedDraftId) {
      setAnalysisData([]);
      return;
    }
    const fetchAnalysisData = async () => {
      setAnalysisLoading(true);
      const { data, error } = await supabase
        .from("draft_analysis")
        .select("*")
        .eq("draft_id", selectedDraftId)
        .order("pick_no", { ascending: true });
      if (!error && data) setAnalysisData(data as DraftAnalysis[]);
      setAnalysisLoading(false);
    };
    fetchAnalysisData();
  }, [selectedDraftId]);

  const handleSelectDraftOrMenu = (value: string) => {
    if (value === "show-all-reports") {
      setIsMobileMenuOpen(true);
    } else if (value === "profile-view") {
      navigate(`/profile?userId=${userId}`);
    } else {
      setSelectedDraftId(value);
      setSearchParams({ userId: userId || "", draftId: value, view });
    }
  };

  const handleViewChange = (newView: "awards" | "datatable") => {
    setView(newView);
    setSearchParams({
      userId: userId || "",
      draftId: selectedDraftId || "",
      view: newView,
    });
  };

  const handleDesktopViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: "awards" | "datatable" | null,
  ) => {
    if (newView !== null) {
      handleViewChange(newView);
    }
  };

  const selectedDraft =
    analyzedDrafts.find((d) => d.draft_id === selectedDraftId) || null;

  const rowsToDisplay =
    showMyPicksOnly && selectedDraft
      ? analysisData.filter(
          (pick) => pick.display_name === selectedDraft.user_team_name,
        )
      : analysisData;

  const handleMobileMenuClose = () => setIsMobileMenuOpen(false);

  if (!loading && analyzedDrafts.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
          textAlign: "center",
          p: 4,
          color: "white",
        }}
      >
        <CircularProgress sx={{ mb: 3 }} />
        <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
          Analyzing Your Drafts...
        </Typography>
        <Typography color="text.secondary">
          This may take a few minutes. The page will update automatically.
        </Typography>
      </Box>
    );
  }

  if (error)
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );

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
      <Box
        sx={{ display: { xs: "none", md: "flex" }, width: 288, flexShrink: 0 }}
      >
        <Drawer
          variant="permanent"
          sx={{
            "& .MuiDrawer-paper": {
              width: 288,
              boxSizing: "border-box",
              bgcolor: "rgba(10, 14, 25, 0.5)",
              borderRight: "1px solid",
              borderColor: "rgba(0, 210, 255, 0.2)",
              backdropFilter: "blur(16px)",
            },
          }}
        >
          <DraftSelector
            drafts={analyzedDrafts}
            selectedDraftId={selectedDraftId}
            onSelectDraft={handleSelectDraftOrMenu}
            userId={userId}
          />
        </Drawer>
      </Box>

      <Drawer
        open={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
        sx={{ display: { xs: "block", md: "none" } }}
        PaperProps={{
          sx: {
            width: "75%",
            bgcolor: "slate.900",
            borderRight: 1,
            borderColor: "cyan.500/30",
          },
        }}
      >
        <DraftSelector
          drafts={analyzedDrafts}
          selectedDraftId={selectedDraftId}
          onSelectDraft={(draftId) => {
            handleSelectDraftOrMenu(draftId);
            handleMobileMenuClose();
          }}
          userId={userId}
        />
      </Drawer>

      <Box
        component="main"
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <AppHeader
          drafts={analyzedDrafts}
          selectedDraftId={selectedDraftId}
          onSelectDraftOrMenu={handleSelectDraftOrMenu}
          currentView={view}
          onViewChange={handleViewChange}
          userId={userId}
        />
        <Box sx={{ p: { xs: 2, md: 4 }, flexGrow: 1, position: "relative" }}>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(to right, rgba(128, 128, 128, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(128, 128, 128, 0.07) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              zIndex: -1,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "-50px",
              margin: "auto",
              height: "310px",
              width: "310px",
              borderRadius: "50%",
              bgcolor: "primary.main",
              opacity: 0.2,
              filter: "blur(100px)",
              zIndex: -1,
            }}
          />

          <Box
            sx={{
              mb: 4,
              display: { xs: "none", md: "flex" },
              justifyContent: "center",
            }}
          >
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={handleDesktopViewChange}
              aria-label="View toggle"
              sx={{
                backgroundColor: "slate.900",
                borderRadius: "9999px",
                p: 0.5,
                border: "1px solid",
                borderColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              <ToggleButton
                value="awards"
                disabled={!selectedDraft || selectedDraft.awards.length === 0}
                sx={{
                  borderRadius: "9999px !important",
                  border: "none",
                  px: 3,
                  color: view === "awards" ? "black" : "text.secondary",
                  backgroundColor:
                    view === "awards" ? "primary.main" : "transparent",
                  "&:hover": {
                    backgroundColor:
                      view !== "awards"
                        ? "rgba(255,255,255,0.1)"
                        : "primary.dark",
                  },
                }}
              >
                Awards
              </ToggleButton>
              <ToggleButton
                value="datatable"
                sx={{
                  borderRadius: "9999px !important",
                  border: "none",
                  px: 3,
                  color: view === "datatable" ? "black" : "text.secondary",
                  backgroundColor:
                    view === "datatable" ? "primary.main" : "transparent",
                  "&:hover": {
                    backgroundColor:
                      view !== "datatable"
                        ? "rgba(255,255,255,0.1)"
                        : "primary.dark",
                  },
                }}
              >
                DRAFT BOARD
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {selectedDraft &&
          selectedDraft.awards.length === 0 &&
          selectedDraft.analysis_status === "COMPLETE" ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "50vh",
                textAlign: "center",
                p: 2,
              }}
            >
              <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                Analysis Not Supported
              </Typography>
              <Typography color="text.secondary">
                This draft type is not currently supported.
              </Typography>
            </Box>
          ) : view === "datatable" ? (
            isAnalysisLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : isMobile ? (
              <Box>
                {showRotateTip && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textAlign: "center", display: "block", mb: 2 }}
                  >
                    Tip: Rotate for full table view 🔄
                  </Typography>
                )}
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        color="primary"
                        checked={showMyPicksOnly}
                        onChange={(e) => setShowMyPicksOnly(e.target.checked)}
                      />
                    }
                    label={
                      <Typography variant="caption">My Picks Only</Typography>
                    }
                  />
                </Box>
                <Stack>
                  {rowsToDisplay.map((pick) => (
                    <MobileDraftCard key={pick.id} pick={pick} />
                  ))}
                </Stack>
              </Box>
            ) : (
              <Box>
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        color="primary"
                        checked={showMyPicksOnly}
                        onChange={(e) => setShowMyPicksOnly(e.target.checked)}
                      />
                    }
                    label={
                      <Typography variant="caption">My Picks Only</Typography>
                    }
                  />
                </Box>
                <Box
                  sx={{
                    height: "80vh",
                    width: "100%",
                    backgroundColor: "background.paper",
                  }}
                >
                  <DataGrid
                    rows={rowsToDisplay}
                    columns={columns}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 100 } },
                    }}
                    pageSizeOptions={[25, 50, 100]}
                    disableRowSelectionOnClick
                  />
                </Box>
              </Box>
            )
          ) : (
            <AwardsDisplay selectedDraft={selectedDraft} userId={userId} />
          )}
        </Box>
      </Box>
      <BottomNavBar
        userId={userId}
        currentView={view}
        onViewChange={handleViewChange}
      />
    </Box>
  );
}
