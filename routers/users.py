from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth_utils import get_current_user
from database import get_db
from models import GameHistory, User
from schemas import GameHistoryOut, UserProfile

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserProfile)
def get_me(current_user: User = Depends(get_current_user)):
    """Retourne le profil de l'utilisateur connecté."""
    return UserProfile(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        created_at=current_user.created_at,
        games_played=0,
        games_won=0,
        win_rate=0.0,
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
