from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserOut(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True


class UserProfile(UserOut):
    created_at: datetime
    games_played: int = 0
    games_won: int = 0
    win_rate: float = 0.0
    total_score: int = 0

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GameHistoryOut(BaseModel):
    id: int
    secret_word: str
    attempts_count: int
    is_won: bool
    score: int
    language: str
    created_at: datetime

    class Config:
        from_attributes = True
