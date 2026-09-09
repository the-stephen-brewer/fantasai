# Draft Edge - Project Context (GEMINI.md)

## Project Overview

**Name:** Draft Edge
**URL:** [draftedge.ai](https://draftedge.ai)
**Type:** Single Page Application (SPA)

**Description:** Draft Edge is a deep-analytics platform for fantasy football managers. Users input their Sleeper username, and the application ingests their past draft data. It cross-references every pick against historical Expert Consensus Rankings (ECR), week-to-week injury data, and Value Over Replacement (VOR) metrics. The app generates personalized awards (highlighting both brilliant moves and terrible mistakes) and provides data-driven insights to uncover the betting and drafting habits that cost users money.

## Core Value Proposition

"Stop Guessing. Start Dominating."

Draft Edge goes beyond surface-level fantasy analysis. Instead of just looking at total points, the engine contextualizes every draft pick using advanced, localized metrics. It calculates true draft value by comparing a player's actual season performance against the _historical expectation_ for that specific draft slot, dynamically adjusting for league size and Superflex settings. It praises draft steals, roasts egregious reaches, and proves once and for all who the best drafter in the league actually is.

## Core Analytical Methodology (Backend Engine)

The backend `polars` engine evaluates a draft using the following analytical pipeline:

1. **Contextualize Settings:** Ingests the draft context, specifically noting the season year, `league_size`, and whether it is a `Superflex` league.
2. **Determine Consensus:** Maps drafted players (via GSIS ID) to the historical ADP (Average Draft Position) and ECR (Expert Consensus Rankings) for that specific season to determine if a pick was a "reach" or a "steal" (`adp_delta = ecr - pick_no`).
3. **Calculate Expected Value:** Generates a baseline `expected_vor` curve for the draft based on the league size and Superflex rules to determine what a generic player drafted at that slot _should_ have scored.
4. **Isolate True Performance:** Calculates the weekly VOR for every player. Crucially, it filters out injury weeks when calculating `avg_vor` (mean) and `vor_std_dev` (consistency), ensuring a player's performance rating isn't skewed by weeks they were physically unable to play.
5. **Assign Draft Grade:** Calculates the ultimate `draft_value` metric for every single pick: `Actual Season VOR - Expected VOR for the Draft Slot`.

## System Architecture & Data Flow

1. **User Input:** User enters their Sleeper username on the React frontend.
2. **Database Write:** The frontend uses the **Supabase client library** to write a new processing request to the PostgreSQL database.
3. **Trigger Event:** This database insert triggers an **AWS Queue and Lambda function**.
4. **Data Processing:** Python scripts (`polars`) running in the AWS Lambda execute the heavy draft analysis and write the results back to the Supabase database.
5. **Frontend Polling:** The React frontend polls the database (`processing_queue`) until the data is ready, then fetches the final results and renders the dashboard.

## Technical Stack & Libraries

- **Core:** React 19, TypeScript, Vite
- **Routing:** React Router v7 (`@react-router/dom`, file-based route paradigm)
- **UI/Components:** Material UI (MUI v7), `@mui/x-data-grid` (for heavy data tables)
- **Styling:** Tailwind CSS v4, MUI `ThemeProvider` / `CssBaseline`, Emotion
- **Icons:** `@heroicons/react`, `@mui/icons-material`, `react-inlinesvg`
- **Database & BaaS:** Supabase JS v2 (PostgreSQL)
- **Analytics:** PostHog (`posthog-js`, `@posthog/react`)
- **Backend Analytics:** Python, `polars` (for high-performance dataframe manipulation)

## Project Structure & Patterns

- `app/routes/`: Contains page-level components (e.g., `home.tsx`, `awards.tsx`). These act as the entry points for specific URLs.
- `app/components/`: Contains modular, reusable UI pieces (e.g., `draft-analysis.tsx`, `TrophyCard.tsx`).
- `app/integrations/`: Third-party setups (e.g., `supaclient.tsx`).
- `app/models.ts`: Global TypeScript interfaces and type definitions.
- `app/theme.ts`: Custom MUI theme configuration (Dark mode, neon accents).

## Data Models (PostgreSQL / SQLAlchemy)

- **`users`**: `id`, `user_id` (Unique), `user_display_name`
- **`user_drafts`**: Maps a user to their specific leagues (`external_draft_id`, `league_name`, `draft_type`, etc.)
- **`processing_queue`**: Manages background AWS jobs (`external_draft_id`, `status`, `message`)
- **`draft_analysis`**: Pick-by-pick metrics (`draft_id`, `pick_no`, `player_id`, `ecr`, `season_vor`, `expected_vor`, `adp_delta`, `draft_value`)
- **`draft_awards`**: Generated trophies (`draft_id`, `award_title`, `award_description`, `award_context`)

## Domain Terminology Context for AI

- **Sleeper:** A popular fantasy sports platform.
- **ADP (Average Draft Position):** Where a player is typically drafted across all leagues.
- **ECR (Expert Consensus Ranking):** The average rank given to a player by fantasy football experts pre-draft.
- **VOR (Value Over Replacement):** A metric used to determine a player's value compared to a "replacement level" player at the same position.
- **Bust:** A player who heavily underperforms their draft position.
- **Sleeper/Steal:** A player who heavily overperforms their draft position.

---

## Business Logic: The Award System

The backend generates specific awards using `polars` dataframes, evaluating metrics like `season_vor` (Value Over Replacement), `draft_value`, `ecr`, and `pick_no`. The frontend categorizes these into specific UI groups via `awardConfig`.

### 1. Hall of Fame (Positive Outcomes)

- **Draft Rank Overall:** Best overall draft class (Max sum of `season_vor`).
- **Draft Rank Value:** Best value draft class (Max sum of `draft_value`).
- **Gold / Silver / Bronze Pick:** The top 3 single picks of the entire draft (Sorted by `draft_value` DESC).
- **The Anchor:** Highest value player drafted in the first 2 rounds.
- **Mid Round Magician:** Highest draft value found in rounds 5-10.
- **Sleeper God:** Found a starter-level talent late (Highest `season_vor` in round 12+).
- **Deep Sea Fisher:** Most combined value from players outside the top 100 ECR.
- **The Opportunist:** Best value from fallen players in rounds 1-10 (Highest average of `ecr` - `pick_no`, filtered for positive avg VOR).
- **Steady Studs:** Most consistent producers (Lowest average `vor_std_dev` using only active injury-free weeks).
- **The Crystal Ball:** Best rookie drafted late (Highest `season_vor` for `years_exp = 0` in round 8+).
- **The Nostradamus:** Reached >2 rounds (24+ picks) early for a player who ended up finishing top-10 at their position in VOR.

### 2. Hall of Shame (Mistakes & Bad Luck)

- **The Toilet Award:** The worst 3 picks based on negative draft value.
- **The Reacher:** Reached the furthest on average in rounds 1-10 (Highest average of `pick_no` - `ecr`).
- **Ryan Leaf Trophy:** Highest draft capital spent on a massive bust (Earliest pick whose positional rank by VOR fell outside the top 50).
- **The Mirage:** Largest gap between expectation and reality (Max difference of `expected_vor` - `season_vor`).
- **Grim Reaper:** Most players who missed significant time (Count of players where `weeks_injured > 8`).

### 3. Draft Strategy (Neutral Observations)

- **[Position] Scout (QB, RB, WR, TE, K):** Drafted the best players at a specific position (Max sum of `season_vor` for that pos).
- **The ADP Slave:** Deviated the least from consensus rankings (Lowest absolute average of `pick_no` - `ecr`).
- **Zero-RB Disciple:** Waited the longest to draft their first RB (Highest `pick_no` for their first RB).
- **QB Hoarder:** Drafted a backup QB before anyone else took a backup (Lowest `pick_no` for a manager's 2nd drafted QB).

### 4. Curiosities (Interesting Facts & Luck)

- **The Lottery Winner:** Highest performing player drafted in the final 3 rounds.
- **The Homer:** Drafted 3+ players from the same NFL team.
- **Cougar Chaser:** Drafted the oldest team on average.
- **Cradle Robber:** Drafted the youngest team on average.
- **Iron Man:** Draft class with the most total games played (Lowest combined injury missed time).

### 5. Bests and Worsts (Personal Awards)

- **My Best Pick:** The individual manager's single best pick (Max `draft_value`).
- **My Worst Pick:** The individual manager's single worst pick (Min `draft_value`).
