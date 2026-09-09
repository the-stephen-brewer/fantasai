import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Tooltip,
  Chip,
} from "@mui/material";
import type { UserProfile } from "../models";
import { TraitCard } from "./TraitCard";
import ShareButton from "./ShareButton";

interface ProfileOverviewProps {
  profile: UserProfile;
}

const getGradeColor = (grade: string | null, opacity: string = "1") => {
  const gradeUpper = grade?.toUpperCase() ?? "";
  if (gradeUpper.startsWith("A")) return `rgba(0, 255, 150, ${opacity})`;
  if (gradeUpper.startsWith("B")) return `rgba(100, 220, 200, ${opacity})`;
  if (gradeUpper.startsWith("C")) return `rgba(255, 215, 0, ${opacity})`;
  if (gradeUpper.startsWith("D")) return `rgba(255, 140, 0, ${opacity})`;
  if (gradeUpper.startsWith("F")) return `rgba(255, 80, 80, ${opacity})`;
  return `rgba(255, 255, 255, ${opacity})`;
};

export default function ProfileOverview({ profile }: ProfileOverviewProps) {
  const isValuePositive = profile.total_draft_value >= 0;

  return (
    <Card
      sx={{
        mb: 2,
        background:
          "linear-gradient(to right bottom, rgba(30, 33, 50, 0.9), rgba(18, 20, 32, 0.9))",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 2,
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      }}
    >
      <CardContent sx={{ pb: "16px !important" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            mb: 2,
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: "bold",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textAlign: "left",
              fontSize: { xs: "1.2rem", sm: "1.5rem" },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            Drafting DNA
          </Typography>
          <Box sx={{ display: "flex", alignItems: 'center', gap: 1, mt: { xs: 1, sm: 0 } }}>
            <Chip
              label={`${profile.draft_count} Drafts`}
              size="small"
              variant="outlined"
              sx={{
                color: "text.secondary",
                borderColor: "rgba(255, 255, 255, 0.2)",
              }}
            />
            <Chip
              label={`${profile.total_picks} Picks`}
              size="small"
              variant="outlined"
              sx={{
                color: "text.secondary",
                borderColor: "rgba(255, 255, 255, 0.2)",
              }}
            />
            <ShareButton
                draftGrade={profile.letter_grade}
                draftValue={profile.total_draft_value}
                userDisplayName={profile.user_name}
            />
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                textAlign: "center",
                p: 2,
                borderRadius: 2,
                height: "100%",
                background: `radial-gradient(ellipse at center, ${getGradeColor(
                  profile.letter_grade,
                  "0.08"
                )} 0%, ${getGradeColor(profile.letter_grade, "0")} 70%)`,
              }}
            >
              <Tooltip title="Your overall letter grade rating across all analyzed drafts.">
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mb: 0.5 }}
                >
                  Overall Draft Grade
                </Typography>
              </Tooltip>
              {profile.letter_grade && (
                <Typography
                  component="p"
                  sx={{
                    fontSize: { xs: "3rem", sm: "4rem", md: "5rem" },
                    fontWeight: "900",
                    color: getGradeColor(profile.letter_grade),
                    textShadow: `0 0 12px ${getGradeColor(
                      profile.letter_grade,
                      "0.3"
                    )}`,
                  }}
                >
                  {profile.letter_grade}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                textAlign: "center",
                p: 2,
                borderRadius: 2,
                height: "100%",
                background: isValuePositive
                  ? "radial-gradient(ellipse at center, rgba(0, 255, 150, 0.08) 0%, rgba(0, 255, 150, 0) 70%)"
                  : "radial-gradient(ellipse at center, rgba(255, 80, 80, 0.08) 0%, rgba(255, 80, 80, 0) 70%)",
              }}
            >
              <Tooltip title="The cumulative 'Value Over Expected' for every pick. A positive value means you consistently beat the market.">
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mb: 0.5 }}
                >
                  Total Draft Value
                </Typography>
              </Tooltip>
              <Typography
                component="p"
                sx={{
                  fontSize: { xs: "3rem", sm: "4rem", md: "5rem" },
                  fontWeight: "900",
                  color: isValuePositive ? "success.main" : "error.light",
                  textShadow: isValuePositive
                    ? "0 0 12px rgba(0, 255, 150, 0.3)"
                    : "0 0 12px rgba(255, 80, 80, 0.3)",
                }}
              >
                {profile.total_draft_value > 0 ? "+" : ""}
                {profile.total_draft_value.toFixed(2)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={3} alignItems="stretch" justifyContent="center">
          {/* ... TraitCards */}
        </Grid>
      </CardContent>
    </Card>
  );
}
