import pytest
from core.vor import get_replacement_players

def test_get_replacement_players_standard_12():
    """Test replacement levels for a standard 12-team league."""
    replacements = get_replacement_players(num_teams=12, is_superflex=False)
    
    # Expected:
    # QB: (12 * 1) + 1 = 13
    # RB: ceil(12 * (2 + 1*0.4 + 0.8)) = ceil(12 * 3.2) = 39
    # WR: ceil(12 * (2 + 1*0.6 + 0.8)) = ceil(12 * 3.4) = 41
    # TE: (12 * 1) + 1 = 13
    # K: (12 * 1) + 1 = 13
    
    assert replacements['QB'] == 13
    assert replacements['RB'] == 39
    assert replacements['WR'] == 41
    assert replacements['TE'] == 13
    assert replacements['K'] == 13

def test_get_replacement_players_superflex_10():
    """Test replacement levels for a 10-team Superflex league."""
    replacements = get_replacement_players(num_teams=10, is_superflex=True)
    
    # Expected:
    # QB: ceil(10 * 2) + 4 = 24
    # RB: ceil(10 * (2 + 1*0.4 + 0.6)) = ceil(10 * 3.0) = 30
    # WR: ceil(10 * (2 + 1*0.6 + 0.6)) = ceil(10 * 3.2) = 32
    # TE: (10 * 1) + 1 = 11
    # K: (10 * 1) + 1 = 11
    
    assert replacements['QB'] == 24
    assert replacements['RB'] == 30
    assert replacements['WR'] == 32
    assert replacements['TE'] == 11
    assert replacements['K'] == 11
