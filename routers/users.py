from fastapi import APIRouter, Depends

from auth_utils import get_current_user
from models import User
from schemas import UserProfile

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
