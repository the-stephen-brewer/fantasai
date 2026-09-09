# Draft Edge - Backend Context (GEMINI.md)

## Project Overview

**Name:** Draft Edge (Backend Engine)
**Environment:** AWS Lambda (Docker Container)
**Language:** Python 3.11

**Description:** This is the backend processing engine for Draft Edge. It is responsible for asynchronously processing fantasy football draft analysis jobs. It ingests data from the Sleeper API, performs heavy data manipulation and statistical analysis using `polars` and `scipy`, and writes pick-by-pick analysis and generated awards back to a Supabase (PostgreSQL) database.

## Core Value Proposition

"Stop Guessing. Start Dominating."

Draft Edge goes beyond surface-level fantasy analysis. Instead of just looking at total points, the engine contextualizes every draft pick using advanced, localized metrics. It calculates true draft value by comparing a player's actual season performance against the _historical expectation_ for that specific draft slot, dynamically adjusting for league size and Superflex settings. It praises draft steals, roasts egregious reaches, and proves once and for all who the best drafter in the league actually is.

## Infrastructure & Deployment

- **Deployment Model:** AWS Lambda deployed via Docker Container Images (`public.ecr.aws/lambda/python:3.11`).
- **Entry Point:** `controller.lambda_handler`
- **Persistent Storage:** AWS S3 (`fantasai-cache` bucket) for long-lived dataframe caching.
- **Concurrency Model:** Database-driven queue using PostgreSQL row locking (`with_for_update(skip_locked=True)`). This ensures multiple concurrent Lambda invocations never process the same draft job simultaneously.

## Data Ingestion & Two-Tier Caching (`cache_handler.py`)

Because the Lambda environment is ephemeral, the backend utilizes a smart two-tier caching strategy to prevent redundant data processing (like recalculating historical VOR curves or pulling multi-year ECR data).

1. **Environment-Aware Paths:** The cache handler detects if it's running locally or in AWS. Locally, it uses `~/code/fantasai/tmp`. In AWS, it uses the Lambda's ephemeral `/tmp` directory.
2. **Tier 1 (Memory/Filesystem):** It first checks if the `.parquet` file exists locally in the `/tmp` directory (a "warm" Lambda start).
3. **Tier 2 (S3 Backup):** If the file is missing locally (a "cold" start), it attempts to download it from the `fantasai-cache` S3 bucket.
4. **Cache Updates:** When heavy files like `adp_vor_curve_fit.parquet`, `player_vors_by_season.parquet`, or `yearly_ecr.parquet` are generated, they are written to `/tmp` and immediately uploaded to S3 to persist for future Lambda containers. _(Note: League-specific data like `league_fantasy_points.parquet` is deliberately deleted after processing to prevent cache bloat)._

## The VOR Engine & Analytical Methodology (`vor.py`)

The backend evaluates a draft by calculating true Value Over Replacement (VOR) and comparing it to historical benchmarks. It pre-calculates and caches 8 different league configurations (8, 10, 12, 14 teams x Standard/Superflex) to ensure lightning-fast analysis.

### 1. Dynamic Replacement Level ("Starters + 1" Logic)

Instead of a static baseline, the engine dynamically calculates the "replacement player" (waiver wire level) for every position based on specific league settings:

- **Bench Depth Factors:** Assumes teams draft 1 full backup in standard (Factor = 0.8), but scales back positional hoarding in Superflex (Factor = 0.6) because roster spots are burned on extra QBs.
- **Flex Distribution:** Automatically allocates Flex starting spots as 40% RB and 60% WR to accurately model draft capital.
- **QBs in Superflex:** Transitions QBs from a "streaming" replacement baseline to a "Starters + 1" hoarding baseline.

### 2. True Weekly VOR & Injury Isolation

For every player drafted, the engine fetches their game log and matches it against the points scored by the replacement-level player for that specific week.

- **True VOR:** `Player Points - Replacement Points`
- **Injury/Bye Filtering:** It explicitly flags weeks where a player didn't play (null points). When calculating seasonal averages (`avg_vor`) or consistency (`vor_std_dev`), these 0-point weeks are excluded so a player's actual _per-game capability_ isn't skewed.

### 3. Logarithmic Expected Value Curve (Regression)

To determine if a pick was mathematically a "steal" or a "reach", the engine runs a regression analysis on the last 3 years of fantasy data (Top 200 players).

- It maps historical ADP (Expert Consensus) to actual end-of-season VOR.
- Using `scipy.optimize.curve_fit`, it fits a logarithmic decay model to the data: `Expected VOR = a + b * ln(ADP)`
- This generates a precise "Expected VOR" benchmark for draft slots 1 through 160.
- **Final Draft Value:** Calculates the ultimate grade for a pick: `Actual Season VOR - Expected VOR for the Draft Slot`.

## Database Architecture & Security

To isolate development from production, we use a dual-schema strategy within a single Supabase instance.

### 1. Schema Isolation
- **`public` Schema**: Production environment. Only the `postgres` superuser has write access to this schema.
- **`test` Schema**: Local development and integration testing environment.
- **Automatic Routing**: `database/engine.py` detects the environment:
    - **AWS Lambda**: Defaults to `public`.
    - **Local/Tests**: Defaults to `test`.
    - **Override**: Use `DATABASE_SCHEMA=public` environment variable to force production targeting.

### 2. Connection Management
We use an SQLAlchemy event listener (`SET search_path`) to ensure all database connections are scoped to the correct schema at the session level. This allows all models and triggers to remain schema-agnostic.

### 3. Credential Management
- **Local**: Uses a default development password (to be migrated to `.env`).
- **Lambda**: Retrieves the database password from the `live_db_pass` environment variable.

## Directory Structure

- `core/`: The business logic heart.
  - `vor.py`: The data science engine (Logarithmic regressions, dynamic baselines).
  - `draft_analysis.py`: Joins the VOR metrics to the specific Sleeper draft.
  - `award.py`: The Polars logic that assigns trophies based on draft metrics.
  - `job_processing.py`: Orchestrates the DB reads/writes for a single job.
  - `cache_handler.py`: Manages the two-tier S3/tmp caching system.
  - `league_analysis.py`: Helpers for expected values and caching.
- `database/`: Postgres interactions (`engine.py`, `models.py`).
- `sleeper/`: Integration layer for the Sleeper API (`sleeper_main.py`, `drafts.py`, etc.).
- `nfl/`: Helpers for NFL-specific data (`nfl_wrapper.py`).

## Key Libraries & Technical Choices

- **Data Processing:** `polars` (for high-performance dataframe manipulation).
- **Data Science/Math:** `scipy` (curve fitting/regression), `numpy`.
- **NFL Data Sourcing:** `nflreadpy` (Official Python port of the nflverse data).
- **ORM:** `SQLAlchemy` (leveraging PostgreSQL specific dialects).
- **AWS Integration:** `boto3` (for Event-driven self-invocation and S3 cache management).
