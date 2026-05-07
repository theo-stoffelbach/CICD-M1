from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Iterable

from domain.game import MAX_ATTEMPTS

CLASSIC_GAME_MODE = "classic"
DAILY_GAME_MODE = "daily"
DAILY_SCORE_MULTIPLIER = 2


@dataclass(frozen=True)
class AchievementDefinition:
    code: str
    label: str
    description: str
    icon: str


ACHIEVEMENTS = [
    AchievementDefinition(
        code="first_win",
        label="1ere victoire",
        description="Remporter une premiere partie.",
        icon="emoji_events",
    ),
    AchievementDefinition(
        code="perfect_game",
        label="Coup parfait",
        description="Trouver le mot en un seul essai.",
        icon="bolt",
    ),
    AchievementDefinition(
        code="streak_3",
        label="Serie de 3 jours",
        description="Gagner au moins une partie pendant 3 jours consecutifs.",
        icon="local_fire_department",
    ),
    AchievementDefinition(
        code="streak_7",
        label="Serie de 7 jours",
        description="Gagner au moins une partie pendant 7 jours consecutifs.",
        icon="workspace_premium",
    ),
    AchievementDefinition(
        code="ten_wins",
        label="10 victoires",
        description="Atteindre 10 parties gagnees.",
        icon="military_tech",
    ),
    AchievementDefinition(
        code="score_1000",
        label="1000 points",
        description="Cumuler 1000 points au classement.",
        icon="leaderboard",
    ),
]


def compute_game_score(is_won: bool, attempts_count: int, multiplier: int = 1) -> int:
    if not is_won:
        return 0
    return max(MAX_ATTEMPTS - attempts_count + 1, 0) * 100 * multiplier


def compute_current_streak(history: Iterable, today: date | None = None) -> int:
    winning_dates = _winning_dates(history)
    if not winning_dates:
        return 0

    current = today or date.today()
    if current not in winning_dates:
        current = current - timedelta(days=1)

    streak = 0
    while current in winning_dates:
        streak += 1
        current = current - timedelta(days=1)
    return streak


def compute_best_streak(history: Iterable) -> int:
    ordered_dates = sorted(_winning_dates(history))
    if not ordered_dates:
        return 0

    best = 1
    current = 1
    for previous, day in zip(ordered_dates, ordered_dates[1:]):
        if day == previous + timedelta(days=1):
            current += 1
        else:
            current = 1
        best = max(best, current)
    return best


def build_achievements(history: list, total_score: int) -> list[dict]:
    wins = sorted((item for item in history if item.is_won), key=lambda item: item.created_at)
    best_streak = compute_best_streak(history)

    unlocked_at_by_code = {
        "first_win": wins[0].created_at if wins else None,
        "perfect_game": _first_matching_date(wins, lambda item: item.attempts_count == 1),
        "streak_3": _streak_unlock_date(history, 3),
        "streak_7": _streak_unlock_date(history, 7),
        "ten_wins": wins[9].created_at if len(wins) >= 10 else None,
        "score_1000": _score_unlock_date(history, 1000),
    }

    if best_streak < 3:
        unlocked_at_by_code["streak_3"] = None
    if best_streak < 7:
        unlocked_at_by_code["streak_7"] = None
    if total_score < 1000:
        unlocked_at_by_code["score_1000"] = None

    return [
        {
            "code": achievement.code,
            "label": achievement.label,
            "description": achievement.description,
            "icon": achievement.icon,
            "unlocked": unlocked_at_by_code[achievement.code] is not None,
            "unlocked_at": unlocked_at_by_code[achievement.code],
        }
        for achievement in ACHIEVEMENTS
    ]


def _winning_dates(history: Iterable) -> set[date]:
    return {_as_date(item.created_at) for item in history if item.is_won}


def _as_date(value: datetime) -> date:
    return value.date()


def _first_matching_date(history: Iterable, predicate) -> datetime | None:
    for item in history:
        if predicate(item):
            return item.created_at
    return None


def _streak_unlock_date(history: Iterable, required_length: int) -> datetime | None:
    wins_by_day = defaultdict(list)
    for item in history:
        if item.is_won:
            wins_by_day[_as_date(item.created_at)].append(item.created_at)

    current = 0
    previous_day = None
    for day in sorted(wins_by_day):
        if previous_day is not None and day == previous_day + timedelta(days=1):
            current += 1
        else:
            current = 1
        if current >= required_length:
            return min(wins_by_day[day])
        previous_day = day
    return None


def _score_unlock_date(history: Iterable, threshold: int) -> datetime | None:
    total = 0
    for item in sorted(history, key=lambda history_item: history_item.created_at):
        total += item.score
        if total >= threshold:
            return item.created_at
    return None
