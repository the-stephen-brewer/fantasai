# Project Backlog - Draft Edge

## Epic: Testing & Validation (The Safety Net)
**Priority: Immediate**

### Objectives
Establish a repeatable, automated testing suite to verify current system behavior. This provides the "safety net" required to perform the Foundations Refactor without regressing calculation accuracy or data integrity.

### Measures of Success
- **Baseline Snapshots:** JSON/CSV snapshots of analysis results for 'greggyb23' are stored and versioned.
- **Repeatable Execution:** `pytest` runs in < 10 seconds locally without requiring a live Sleeper connection (using mocks/VCR).
- **Regression Proof:** The refactored code produces 100% identical VOR and Award results compared to the baseline for the test user.

### Primary Tasks
- [x] **Initialize Test Suite**: Install `pytest`, `pytest-mock`, and `vcrpy`. Create `tests/conftest.py`.
- [x] **Capture Regression Snapshots**: Create a script to run a full analysis for user `greggyb23` and save `DraftAnalysis` and `DraftAward` results to `tests/snapshots/greggyb23/`.
- [x] **Unit Test VOR Engine**: Write tests for `core/vor.py` functions (Replacement levels, Curve fitting) using fixed input data.
- [x] **Mock Sleeper API**: Create a mock layer for `sleeperpy` to allow the engine to run against the snapshots without network calls.
- [x] **Database Integration Test**: Verify the job queue state machine (queued -> processing -> complete) using a test database session.

---

## Epic: Foundations Refactor (Multi-Provider Support)
**Priority: High (Post-Testing)**

### Objectives
Prepare the system architecture to support multiple fantasy platform providers (ESPN, Yahoo) by decoupling Sleeper-specific logic from the core analytical engine. The goal is to move from a "Sleeper-first" application to a "Platform-Agnostic" engine with provider plugins.

### Measures of Success
- **Zero Sleeper Imports in `core/`:** Core analysis files (`vor.py`, `award.py`, `draft_analysis.py`) should not import `sleeperpy` or `sleeper.*`.
- **Interchangeable Providers:** A new provider can be added by implementing a single interface without modifying the calculation logic.
- **Unified Data Schema:** All draft data is normalized into a standard internal format before reaching the analysis phase.
- **Passing Test Suite:** A mock provider can trigger a full analysis run successfully.

### Key Steps
1. **Interface Definition:** Establish the `BaseProvider` abstract contract.
2. **Provider Implementation:** Migrate existing Sleeper logic into a encapsulated `SleeperProvider`.
3. **Core Decoupling:** Refactor `analyze_draft` and VOR calculations to accept normalized DataFrames.
4. **Orchestration Refactor:** Update `job_processing.py` to use a `ProviderFactory`.

---

### Primary Tasks

#### 1. Foundation & Interfaces
- [ ] **Define `BaseProvider` ABC**: Create `core/providers/base.py` with methods for `get_draft_metadata`, `get_picks`, and `get_user_info`.
- [ ] **Standardize Models**: Define internal Pydantic models or TypedDicts for `InternalDraftMetadata` and `InternalPick`.
- [ ] **Create `ProviderFactory`**: Implement logic to instantiate the correct provider based on `platform_name`.

#### 2. Sleeper Migration (Refactoring)
- [ ] **Implement `SleeperProvider`**: Move Sleeper-specific API calls and metadata extraction logic into `core/providers/sleeper.py`.
- [ ] **Standardize Scoring Mapping**: Map Sleeper's `scoring_settings` keys to a unified internal format (e.g., `fgm_50p` vs platform-specific keys).
- [ ] **Isolate User Resolution**: Move `get_sleeper_usernames` into the provider and return a generic mapping.

#### 3. Core Engine Refactor
- [ ] **Refactor `analyze_draft`**: Update `core/draft_analysis.py` to accept normalized Polars DataFrames instead of raw API response objects.
- [ ] **Decouple VOR Logic**: Ensure `core/vor.py` relies solely on `gsis_id` and internal scoring rules.
- [ ] **Move Platform Logic from `job_processing.py`**: Remove Sleeper-specific "dynasty" and "kicker" checks from the main loop; move these to provider-specific validation.

#### 4. Testing & Validation
- [ ] **Implement `MockProvider`**: Create a provider that returns static data for local testing.
- [ ] **End-to-End Simulation**: Verify `process_job` works end-to-end using the factory and the refactored core.
- [ ] **Database Schema Update (Audit)**: Ensure `external_draft_id` lookups in `user_drafts` are correctly scoped by `platform_name`.
