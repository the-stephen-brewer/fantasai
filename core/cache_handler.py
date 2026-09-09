import boto3
import os
from pathlib import Path
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
BUCKET_NAME = "fantasai-cache"

if os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
    CACHE_DIR = Path('/tmp')
else:
    # Local development: Use your home folder
    CACHE_DIR = Path('~/code/fantasai/tmp').expanduser()

# Ensure the directory exists (safe for both)
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# The files we store in the cache
CURVE_FIT_DATA = CACHE_DIR / "adp_vor_curve_fit.parquet"
PLAYER_VORS_BY_SEASON_FILE = CACHE_DIR / "player_vors_by_season.parquet"
YEARLY_ECR_CACHE_FILE = CACHE_DIR / "yearly_ecr.parquet"
LEAGUE_FANTASTY_POINTS_FILE = CACHE_DIR / "league_fantasy_points.parquet"
PLAYERS_CACHE = CACHE_DIR / "players.parquet"

def get_file_from_cache(local_path: Path) -> bool:
    """
    Checks for a file in the cache.
    In Lambda, it checks S3 and downloads if found.
    Locally, it just checks if the file exists.
    
    Args:
        local_path (Path): The Path object for the desired local file.
        
    Returns:
        bool: True if the file is now available locally, False otherwise.
    """
    if local_path.exists():
        print(f"Cache hit locally: {local_path}")
        return True

    if os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
        s3_key = local_path.name
        try:
            print(f"Local cache miss. Checking S3 cache: s3://{BUCKET_NAME}/{s3_key}")
            s3.download_file(BUCKET_NAME, s3_key, str(local_path))
            print(f"S3 cache hit. Downloaded to {local_path}")
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                print("Cache miss on S3.")
            else:
                print(f"An error occurred fetching from S3: {e}")
            return False
    
    return False

def save_file_to_cache(local_path: Path):
    """
    Saves a local file to the S3 cache if running in Lambda.
    """
    if os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
        s3_key = local_path.name
        print(f"Saving file to S3 cache: s3://{BUCKET_NAME}/{s3_key}")
        s3.upload_file(str(local_path), BUCKET_NAME, s3_key)
        print("File saved to S3 cache.")