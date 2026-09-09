# Project Soul: Draft Edge (Fantasai)

**Status:** Active Development / Initial Traction Phase  
**Last Sync:** April 9, 2026

## 1. The Core Vision

Draft Edge is an advanced, high-performance fantasy football analytics engine. Unlike generic "draft grade" tools, it targets **intermediate-to-expert managers**. It utilizes a two-tier architectural approach (Lambda/Supabase/S3) to perform heavy statistical regressions that translate draft capital into actual Value Over Replacement (VOR).

## 2. Technical Stack & Environment

- **Backend:** Python 3.11 (AWS Lambda via Docker).
- **Frontend:** React 19, React Router v7, MUI v7, Tailwind v4.
- **Database:** Supabase (PostgreSQL) with `pg_net` for asynchronous triggers.
- **Data Science:** `polars` (Strictly no Pandas), `scipy` (for logarithmic curve fitting), `nflreadpy`.
- **Infrastructure:** AWS S3 (`fantasai-cache`) for Parquet-based long-lived caching.

## 3. The "State of the Machine" (Crucial Context)

- **The Job Queue Pattern:** We use a "Receptionist/Worker" pattern.
  1.  Frontend inserts a row into the `processing_queue` table.
  2.  Postgres Trigger (via `pg_net` extension) pings the Lambda Function URL.
  3.  **Receptionist Phase:** The Lambda receives the hit, returns a `202 Accepted` immediately, and invokes _itself_ asynchronously using `boto3` with `InvocationType='Event'` and a flag `is_background_worker=True`.
  4.  **Worker Phase:** The secondary execution performs the heavy analysis and updates Supabase.
- **The Caching Strategy:** To handle Lambda's ephemeral nature, we use `cache_handler.py`. It checks `/tmp` first (warm start), then the `fantasai-cache` S3 bucket (cold start). All heavy `.parquet` files (VOR curves, ECR data) live here to avoid re-calculating regressions on every hit.
- **The Database Trigger:** The triggers are managed via SQLAlchemy DDL listeners in `models.py`. We use raw `net.http_post` with a **7000ms timeout** and a custom **User-Agent** to ensure the "handshake" between Supabase and AWS Lambda doesn't fail during cold starts.

## 4. Analytical Methodology (The "Secret Sauce")

- **Dynamic Replacement Level:** We don't use a static baseline. We calculate replacement levels based on league size and format (e.g., 8-team vs 14-team, Superflex vs Standard) using a "Starters + 1" hoarding logic.
- **VOR Curve Fitting:** We perform a logarithmic regression ($Expected VOR = a + b * \ln(ADP)$) on historical data to generate "Expected VOR" for every draft slot (1-160).
- **Strategy Detection:** The engine identifies advanced heuristics:
  - **Hero RB:** 1 elite RB in rounds 1-2, then no RBs until round 7+.
  - **Asymmetric Upside:** High rookie/volatility concentration in late rounds.
  - **Zero-RB:** High-capital WR/TE/QB builds that bypass early RBs.

## 5. UI/UX Aesthetic Guidelines

- **Theme:** "High-Tech Dark Mode." Deep navy/charcoal backgrounds, pure white headers with cyan text-glows.
- **Components:** Material UI v7 core components styled with Tailwind v4.
- **Visual Grammar:** \* **Neon Green:** Positive Value / "Steals".
  - **Neon Red:** Negative Value / "Reaches".
  - **Slate Gray:** League Average / Baseline.
- **The Dashboard:** The "Draft Profile" is the central "Spotify Wrapped" style scorecard for a user's entire draft season across all their leagues.

## 6. Known Technical Debt & Quirks

- **Numpy/Pandas Conflict:** There is a binary incompatibility issue in the local environment if Pandas is imported. **Rule: Always use Polars.**
- **Supabase Sleep:** The project is on the free tier; if it sleeps, the `pg_net` worker may need a "kick" (altering the extension) to resume triggers.
- **JSONB Handling:** Aggregated data (positional value, strategy flags) is stored in Postgres JSONB columns. Ensure the React frontend strictly types these objects using the interfaces in `app/models.ts`.

## 7. Immediate Roadmap

1.  **Refine Social Sharing:** Implement `html-to-image` on the profile page to allow "Copy to Clipboard" for Sleeper chats.
2.  **Strategy Insights:** Flesh out the `profile_analysis.py` logic to generate more nuanced text summaries based on the detected `strategy_flags`.
3.  **Dynamic OG Images:** Implement a Lambda endpoint that uses `Pillow` to generate dynamic preview images for social media links.

---

**Instruction for the next AI:** "Read `soul.md`, `GEMINI.md`, and `todo.md`. Do not ask for context. I am ready to resume work on the next incomplete task in `todo.md`. Follow the tech stack constraints and architectural patterns defined in these documents strictly."
