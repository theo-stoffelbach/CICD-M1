from datetime import datetime, timedelta
from types import SimpleNamespace

from engagement import (
    build_achievements,
    compute_best_streak,
    compute_current_streak,
    compute_game_score,
)


def history_item(days_ago: int, is_won: bool = True, attempts_count: int = 3, score: int = 400):
    return SimpleNamespace(
        is_won=is_won,
        attempts_count=attempts_count,
        score=score,
        created_at=datetime.combine(
            datetime.today().date() - timedelta(days=days_ago),
            datetime.min.time(),
        ),
    )


def test_score_rewards_fast_wins_and_zeroes_losses():
    assert compute_game_score(True, 1) == 600
    assert compute_game_score(True, 6) == 100
    assert compute_game_score(False, 6) == 0
    assert compute_game_score(True, 2, multiplier=2) == 1000


def test_current_and_best_streak_use_consecutive_winning_days():
    history = [
        history_item(0),
        history_item(1),
        history_item(2),
        history_item(5),
        history_item(6),
        history_item(7),
        history_item(8),
    ]

    assert compute_current_streak(history) == 3
    assert compute_best_streak(history) == 4


def test_achievements_are_unlocked_from_history():
    history = [
        history_item(2, attempts_count=1, score=600),
        history_item(1, attempts_count=2, score=500),
        history_item(0, attempts_count=3, score=400),
    ]

    achievements = {item["code"]: item for item in build_achievements(history, total_score=1500)}

    assert achievements["first_win"]["unlocked"] is True
    assert achievements["perfect_game"]["unlocked"] is True
    assert achievements["streak_3"]["unlocked"] is True
    assert achievements["streak_7"]["unlocked"] is False
    assert achievements["score_1000"]["unlocked"] is True
