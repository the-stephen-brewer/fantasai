# Draft Edge - Backend Engine

This repository contains the backend processing engine for Draft Edge, responsible for analyzing fantasy football drafts and generating statistical insights and awards.

## 🚀 Getting Started

### Installation

1. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Install testing dependencies:
   ```bash
   pip install pytest pytest-mock vcrpy
   ```

## 🧪 Testing

We use `pytest` for automated testing.

### Running Tests
To run all tests:
```bash
python3 -m pytest tests/
```

### Regression Snapshots
To verify that the engine produces consistent results, we use snapshots. You can generate new snapshots by running:
```bash
python3 tests/create_snapshots.py
```
This script uses `vcrpy` to record network interactions and saves the results in `tests/snapshots/`.

## 🗄️ Database Architecture

### Dual-Schema Setup
We use a single Supabase instance with two schemas to isolate development from production:

- **`public`**: The production schema used by the live AWS Lambda function.
- **`test`**: The development schema used for local testing and experimentation.

The `database/engine.py` automatically routes traffic:
- If `AWS_LAMBDA_FUNCTION_NAME` is set, it uses `public`.
- Otherwise, it defaults to `test`.
- You can override this by setting the `DATABASE_SCHEMA` environment variable:
  ```bash
  DATABASE_SCHEMA=public python3 my_script.py
  ```

### Syncing Data to Test
To populate your local `test` schema with real data for debugging:
```bash
python3 sync_prod_to_test.py
```
This script copies the 10 newest active users and their draft data from `public` to `test`. It is safe to run multiple times as it cleans up existing test data for those users first.

### Permissions & Security
- **Production**: The `postgres` user is the only one with write access to the `public` schema.
- **Lambda Secrets**: In the AWS Lambda environment, the database password is stored in the `live_db_pass` environment variable. **Never hardcode passwords in the repository.**

## 🚢 Deployment

Deployment is handled via Docker images pushed to AWS ECR.

```bash
./dockerpush.sh
```
This script builds the container, tags it with the current git commit hash, and updates the Lambda function.
