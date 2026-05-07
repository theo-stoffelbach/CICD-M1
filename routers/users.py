from fastapi import APIRouter, Depends
from sqlalchemy import Integer, func
from sqlalchemy.orm import Session

from auth_utils import get_current_user
from database import get_db
from models import GameHistory, User
from schemas import GameHistoryOut, UserProfile

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

    return UserProfile(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        created_at=current_user.created_at,
        games_played=games_played,
        games_won=games_won,
        win_rate=win_rate,
        total_score=total_score,
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
