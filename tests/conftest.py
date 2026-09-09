import pytest
from unittest.mock import MagicMock

@pytest.fixture
def mock_db_session():
    """Fixture for a mocked SQLAlchemy database session."""
    return MagicMock()

@pytest.fixture
def mock_sleeper_user():
    """Fixture for a standard Sleeper user response."""
    return {
        "user_id": "938248068674301952",
        "display_name": "greggyb23"
    }
