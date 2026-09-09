import { Box, Typography } from "@mui/material";
import type { RoundPhaseData } from "../models";

// --- Helper Functions for Coloring and Formatting ---

const getSign = (value: number) => (value > 0 ? "+" : "");

// Value vs. League: Standard coloring (positive is good, negative is bad)
const getValueColor = (
  value: number
): { textColor: string; glowRgb: string } => {
  if (value > 2) return { textColor: "text-green-400", glowRgb: "34 197 94" };
  if (value < -2) return { textColor: "text-red-400", glowRgb: "248 113 113" };
  return { textColor: "text-slate-300", glowRgb: "203 213 225" };
};

// ADP Deviation: Flipped coloring (positive is a reach/bad, negative is a steal/good)
const getAdpDeltaColor = (
  adpDelta: number
): { textColor: string; glowRgb: string } => {
  if (adpDelta < -2)
    return { textColor: "text-cyan-400", glowRgb: "34 211 238" }; // Steal (Good)
  if (adpDelta > 2)
    return { textColor: "text-amber-400", glowRgb: "251 191 36" }; // Reach (Bad)
  return { textColor: "text-slate-300", glowRgb: "203 213 225" };
};

// --- Sub-Components ---

const Stat = ({
  label,
  value,
  textColor,
  glow,
}: {
  label: string;
  value: string | number;
  textColor: string;
  glow?: string;
}) => (
  <div className="text-center">
    <Typography
      variant="body2"
      className="text-slate-400 uppercase tracking-wider"
    >
      {label}
    </Typography>
    <span
      className={`font-mono text-3xl font-bold ${textColor}`}
      style={
        glow
          ? ({
              "--accent-rgb": glow,
              filter: "drop-shadow(0 0 8px rgba(var(--accent-rgb), 0.4))",
            } as React.CSSProperties)
          : {}
      }
    >
      {value}
    </span>
  </div>
);

const PhaseSegment = ({
  phaseName,
  data,
}: {
  phaseName: string;
  data: RoundPhaseData[string];
}) => {
  const match = phaseName.match(/(.+) \[([^\]]+)\]/);
  const name = match ? match[1].trim() : phaseName;
  const rounds = match ? `Rds ${match[2]}` : "";

  const valueColor = getValueColor(data.avg_draft_value);
  const adpColor = getAdpDeltaColor(data.avg_adp_delta);

  return (
    <div className="flex-1 p-4">
      <div className="text-center">
        <Typography variant="h6" className="font-bold uppercase text-white">
          {name}
        </Typography>
        <Typography variant="caption" className="text-slate-400">
          {rounds}
        </Typography>
      </div>
      <div className="mt-3 flex items-center justify-around">
        <Stat
          label="Avg. Value"
          value={`${getSign(data.avg_draft_value)}${data.avg_draft_value.toFixed(
            1
          )}`}
          textColor={valueColor.textColor}
          glow={valueColor.glowRgb}
        />
        <Stat
          label="ADP Dev."
          value={`${getSign(data.avg_adp_delta)}${data.avg_adp_delta.toFixed(
            1
          )}`}
          textColor={adpColor.textColor}
        />
      </div>
    </div>
  );
};

// --- Main Component ---

export default function RoundPhaseInsights({
  roundPhaseData,
}: RoundPhaseInsightsProps) {
  // Sort keys logically: Early, Mid, Late
  const sortedPhases = Object.keys(roundPhaseData).sort((a, b) => {
    const order = { E: 0, M: 1, L: 2 };
    return (order[a.charAt(0)] ?? 99) - (order[b.charAt(0)] ?? 99);
  });

  return (
    <Box sx={{ my: 4 }}>
      <Typography
        variant="h4"
        component="h2"
        className="mb-4 text-center font-bold uppercase tracking-widest text-slate-300"
      >
        Phase Tendencies
      </Typography>
      <div className="flex flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50 md:flex-row md:divide-x md:divide-y-0 divide-y divide-slate-700">
        {sortedPhases.map((phase) => (
          <PhaseSegment
            phaseName={phase}
            data={roundPhaseData[phase]}
            key={phase}
          />
        ))}
      </div>
    </Box>
  );
}
