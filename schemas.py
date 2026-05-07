from datetime import date, datetime
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


class AchievementOut(BaseModel):
    code: str
    label: str
    description: str
    icon: str
    unlocked: bool
    unlocked_at: datetime | None = None


class UserProfile(UserOut):
    created_at: datetime
    games_played: int = 0
    games_won: int = 0
    win_rate: float = 0.0
    total_score: int = 0
    current_streak: int = 0
    best_streak: int = 0
    achievements: list[AchievementOut] = Field(default_factory=list)

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
    mode: str = "classic"
    daily_date: date | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    total_score: int
    average_score: float
    games_played: int
    games_won: int
    win_rate: float
    current_streak: int
    best_streak: int


class DailyLeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    score: int
    attempts_count: int
    is_won: bool
    played_at: datetime


class LeaderboardsResponse(BaseModel):
    current_score: list[LeaderboardEntry]
    best_streak: list[LeaderboardEntry]
    average_score: list[LeaderboardEntry]
    daily_challenge: list[DailyLeaderboardEntry]
