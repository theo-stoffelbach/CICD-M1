from collections import defaultdict
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import Integer, func
from sqlalchemy.orm import Session

from auth_utils import get_current_user
from database import get_db
from engagement import DAILY_GAME_MODE, build_achievements, compute_best_streak, compute_current_streak
from models import GameHistory, User
from schemas import DailyLeaderboardEntry, GameHistoryOut, LeaderboardEntry, LeaderboardsResponse, UserProfile

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserProfile)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retourne le profil de l'utilisateur connecté avec ses vraies stats."""
    stats = db.query(
        func.count(GameHistory.id).label("games_played"),
        func.sum(GameHistory.is_won.cast(Integer)).label("games_won"),
        func.sum(GameHistory.score).label("total_score"),
    ).filter(GameHistory.user_id == current_user.id).first()

    games_played = stats.games_played or 0
    games_won = stats.games_won or 0
    total_score = stats.total_score or 0
    win_rate = round((games_won / games_played) * 100, 1) if games_played > 0 else 0.0
    history = _get_user_history(db, current_user.id)

    return UserProfile(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        created_at=current_user.created_at,
        games_played=games_played,
        games_won=games_won,
        win_rate=win_rate,
        total_score=total_score,
        current_streak=compute_current_streak(history),
        best_streak=compute_best_streak(history),
        achievements=build_achievements(history, total_score),
    )


@router.get("/me/history", response_model=list[GameHistoryOut])
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retourne l'historique des parties de l'utilisateur connecté."""
    history = (
        db.query(GameHistory)
        .filter(GameHistory.user_id == current_user.id)
        .order_by(GameHistory.created_at.desc())
        .all()
    )
    return history


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Retourne le classement global historique par score total."""
    return _build_leaderboards(db, limit, date.today()).current_score


@router.get("/leaderboards", response_model=LeaderboardsResponse)
def get_leaderboards(
    limit: int = Query(default=10, ge=1, le=50),
    day: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """Retourne les classements score, série, moyenne et défi du jour."""
    return _build_leaderboards(db, limit, day or date.today())


def _build_leaderboards(db: Session, limit: int, daily_date: date) -> LeaderboardsResponse:
    entries = _build_player_entries(db)
    return LeaderboardsResponse(
        current_score=_rank_entries(
            entries,
            key=lambda entry: (
                -entry["total_score"],
                -entry["best_streak"],
                -entry["games_won"],
                entry["username"].lower(),
            ),
            limit=limit,
        ),
        best_streak=_rank_entries(
            entries,
            key=lambda entry: (
                -entry["best_streak"],
                -entry["total_score"],
                -entry["games_won"],
                entry["username"].lower(),
            ),
            limit=limit,
        ),
        average_score=_rank_entries(
            entries,
            key=lambda entry: (
                -entry["average_score"],
                -entry["total_score"],
                -entry["games_played"],
                entry["username"].lower(),
            ),
            limit=limit,
        ),
        daily_challenge=_build_daily_leaderboard(db, daily_date, limit),
    )


def _build_player_entries(db: Session) -> list[dict]:
    users = db.query(User).all()
    histories_by_user: dict[int, list[GameHistory]] = defaultdict(list)
    for item in db.query(GameHistory).all():
        histories_by_user[item.user_id].append(item)

    entries = []
    for user in users:
        history = histories_by_user[user.id]
        games_played = len(history)
        games_won = sum(1 for item in history if item.is_won)
        total_score = sum(item.score for item in history)
        average_score = round(total_score / games_played, 1) if games_played > 0 else 0.0
        win_rate = round((games_won / games_played) * 100, 1) if games_played > 0 else 0.0
        entries.append({
            "rank": 0,
            "user_id": user.id,
            "username": user.username,
            "total_score": total_score,
            "average_score": average_score,
            "games_played": games_played,
            "games_won": games_won,
            "win_rate": win_rate,
            "current_streak": compute_current_streak(history),
            "best_streak": compute_best_streak(history),
        })

    return entries


def _rank_entries(entries: list[dict], key, limit: int) -> list[LeaderboardEntry]:
    return [
        LeaderboardEntry(**{**entry, "rank": rank})
        for rank, entry in enumerate(sorted(entries, key=key)[:limit], start=1)
    ]


def _build_daily_leaderboard(db: Session, daily_date: date, limit: int) -> list[DailyLeaderboardEntry]:
    rows = (
        db.query(GameHistory, User)
        .join(User, User.id == GameHistory.user_id)
        .filter(
            GameHistory.mode == DAILY_GAME_MODE,
            GameHistory.daily_date == daily_date,
        )
        .all()
    )

    entries = [
        {
            "user_id": user.id,
            "username": user.username,
            "score": history.score,
            "attempts_count": history.attempts_count,
            "is_won": history.is_won,
            "played_at": history.created_at,
        }
        for history, user in rows
    ]

    entries.sort(
        key=lambda entry: (
            -entry["score"],
            entry["attempts_count"],
            entry["played_at"],
            entry["username"].lower(),
        )
    )

    return [
        DailyLeaderboardEntry(**{**entry, "rank": rank})
        for rank, entry in enumerate(entries[:limit], start=1)
    ]


def _get_user_history(db: Session, user_id: int) -> list[GameHistory]:
    return (
        db.query(GameHistory)
        .filter(GameHistory.user_id == user_id)
        .order_by(GameHistory.created_at.asc())
        .all()
    )
