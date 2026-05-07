from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth_utils import hash_password
from database import get_db
from models import User
from schemas import UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(body: UserCreate, db: Session = Depends(get_db)):
    """Crée un nouveau compte utilisateur."""
    existing_user = (
        db.query(User)
        .filter((User.username == body.username) | (User.email == body.email))
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nom d'utilisateur ou email déjà utilisé.",
        )

    user = User(
        username=body.username,
        email=body.email,
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
