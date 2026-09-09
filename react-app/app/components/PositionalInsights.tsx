import { Box, Typography } from "@mui/material";
import type { PositionData } from "../models";

// --- Helper Functions for Coloring and Formatting ---

const getSign = (value: number) => (value > 0 ? "+" : "");

// Value vs. League: Standard coloring (positive is good, negative is bad)
const getValueColor = (
  value: number
): { textColor: string; glowRgb: string } => {
  if (value > 5) return { textColor: "text-green-400", glowRgb: "34 197 94" }; // Green
  if (value < -5) return { textColor: "text-red-400", glowRgb: "248 113 113" }; // Red
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
  unit,
  textColor,
  glow,
  isHero = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  textColor: string;
  glow?: string;
  isHero?: boolean;
}) => (
  <div>
    <Typography
      variant="body2"
      className="text-slate-400 uppercase tracking-wider"
    >
      {label}
    </Typography>
    <span
      className={`font-mono ${
        isHero ? "text-4xl" : "text-2xl"
      } font-bold ${textColor}`}
      style={
        isHero && glow
          ? ({
              "--accent-rgb": glow,
              filter: "drop-shadow(0 0 8px rgba(var(--accent-rgb), 0.4))",
            } as React.CSSProperties)
          : {}
      }
    >
      {value}
    </span>
    {unit && <span className="ml-1 font-mono text-slate-400">{unit}</span>}
  </div>
);

const PositionCard = ({
  position,
  data,
}: {
  position: string;
  data: PositionData[string];
}) => {
  const valueVsLeague = data.avg_draft_value - data.league_avg_draft_value;
  const valueColor = getValueColor(valueVsLeague);
  const adpColor = getAdpDeltaColor(data.avg_adp_delta);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50">
      {/* Accent Header */}
      <div className="bg-slate-800 px-4 py-2 text-center">
        <Typography variant="h6" className="font-bold uppercase text-white">
          {position}
        </Typography>
      </div>

      {/* Stats */}
      <div className="flex flex-grow flex-col justify-between p-4">
        {/* Hero Stat */}
        <div className="text-center">
          <Stat
            label="Value vs. League"
            value={`${getSign(valueVsLeague)}${valueVsLeague.toFixed(1)}`}
            textColor={valueColor.textColor}
            glow={valueColor.glowRgb}
            isHero
          />
        </div>

        {/* Divider */}
        <hr className="my-4 border-slate-700" />

        {/* Secondary Stats */}
        <div className="flex justify-around text-center">
          <Stat
            label="ADP Dev."
            value={`${getSign(data.avg_adp_delta)}${data.avg_adp_delta.toFixed(
              1
            )}`}
            unit="picks"
            textColor={adpColor.textColor}
          />
          <Stat
            label="Picks"
            value={data.count}
            textColor="text-slate-300"
          />
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

export default function PositionalInsights({
  positionData,
}: PositionalInsightsProps) {
  const positions = Object.keys(positionData);

  return (
    <Box sx={{ my: 4 }}>
      <Typography
        variant="h4"
        component="h2"
        className="mb-4 text-center font-bold uppercase tracking-widest text-slate-300"
      >
        Positional Habits
      </Typography>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {positions.map((pos) => (
          <PositionCard position={pos} data={positionData[pos]} key={pos} />
        ))}
      </div>
    </Box>
  );
}
