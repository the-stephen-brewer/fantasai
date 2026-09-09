# player.py
from dataclasses import dataclass, field
from typing import Optional, List, Dict

@dataclass
class Player:
    """Represents a single player from the Sleeper API."""

    player_id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    position: Optional[str] = None
    team: Optional[str] = None
    number: Optional[int] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    age: Optional[int] = None
    years_exp: Optional[int] = None
    status: Optional[str] = None
    active: bool = False
    college: Optional[str] = None
    
    # Less common fields
    birth_date: Optional[str] = None
    birth_city: Optional[str] = None
    birth_state: Optional[str] = None
    birth_country: Optional[str] = None
    high_school: Optional[str] = None
    fantasy_positions: Optional[List[str]] = field(default_factory=list)
    fantasy_data_id: Optional[int] = None
    stats_id: Optional[int] = None
    swish_id: Optional[int] = None
    sportradar_id: Optional[str] = None
    rotowire_id: Optional[int] = None
    rotoworld_id: Optional[int] = None
    espn_id: Optional[int] = None
    yahoo_id: Optional[int] = None
    gsis_id: Optional[str] = None
    pandascore_id: Optional[str] = None
    injury_status: Optional[str] = None
    injury_body_part: Optional[str] = None
    injury_start_date: Optional[str] = None
    injury_notes: Optional[str] = None
    depth_chart_position: Optional[str] = None
    depth_chart_order: Optional[int] = None
    practice_participation: Optional[str] = None
    practice_description: Optional[str] = None
    sport: Optional[str] = None
    hashtag: Optional[str] = None
    search_rank: Optional[int] = None
    search_first_name: Optional[str] = None
    search_last_name: Optional[str] = None
    search_full_name: Optional[str] = None

    @classmethod
    def from_dict(cls, player_id: str, data: Dict):
        """Creates a Player instance from a dictionary."""
        return cls(player_id=player_id, **data)
