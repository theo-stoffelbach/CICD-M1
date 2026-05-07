from datetime import date, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import api
from auth_utils import create_access_token
from database import Base, get_db
from engagement import DAILY_GAME_MODE, DAILY_SCORE_MULTIPLIER, compute_game_score
from models import GameHistory, User


def test_profile_exposes_score_streak_and_achievements():
    client, db, clear_overrides = _client_with_db()
    try:
        user = _create_user(db, "alice")
        _add_history(db, user.id, days_ago=2, attempts_count=1)
        _add_history(db, user.id, days_ago=1, attempts_count=2)
        _add_history(db, user.id, days_ago=0, attempts_count=3)

        response = client.get("/users/me", headers=_auth_headers(user.id))

        assert response.status_code == 200
        data = response.json()
        assert data["total_score"] == 1500
        assert data["current_streak"] == 3
        assert data["best_streak"] == 3

        achievements = {item["code"]: item for item in data["achievements"]}
        assert achievements["first_win"]["unlocked"] is True
        assert achievements["perfect_game"]["unlocked"] is True
        assert achievements["streak_3"]["unlocked"] is True
        assert achievements["streak_7"]["unlocked"] is False
    finally:
        db.close()
        clear_overrides()


def test_leaderboard_orders_players_by_score_then_streak():
    client, db, clear_overrides = _client_with_db()
    try:
        alice = _create_user(db, "alice")
        bob = _create_user(db, "bob")
        _add_history(db, alice.id, days_ago=0, attempts_count=1)
        _add_history(db, alice.id, days_ago=1, attempts_count=2)
        _add_history(db, bob.id, days_ago=0, attempts_count=6)

        response = client.get("/users/leaderboard")

        assert response.status_code == 200
        data = response.json()
        assert data[0]["username"] == "alice"
        assert data[0]["rank"] == 1
        assert data[0]["total_score"] == 1100
        assert data[0]["average_score"] == 550
        assert data[1]["username"] == "bob"
        assert data[1]["rank"] == 2
    finally:
        db.close()
        clear_overrides()


def test_leaderboards_expose_score_streak_average_and_daily_rankings():
    client, db, clear_overrides = _client_with_db()
    try:
        alice = _create_user(db, "alice")
        bob = _create_user(db, "bob")
        _add_history(db, alice.id, days_ago=1, attempts_count=1)
        _add_history(db, alice.id, days_ago=0, attempts_count=2)
        _add_history(
            db,
            bob.id,
            days_ago=0,
            attempts_count=1,
            mode=DAILY_GAME_MODE,
            daily_date=date.today(),
            multiplier=DAILY_SCORE_MULTIPLIER,
        )

        response = client.get("/users/leaderboards")

        assert response.status_code == 200
        data = response.json()
        assert data["current_score"][0]["username"] == "bob"
        assert data["best_streak"][0]["username"] == "alice"
        assert data["average_score"][0]["username"] == "bob"
        assert data["daily_challenge"][0]["username"] == "bob"
        assert data["daily_challenge"][0]["score"] == 1200
    finally:
        db.close()
        clear_overrides()


def test_daily_challenge_rejects_authenticated_replay():
    client, db, clear_overrides = _client_with_db()
    try:
        user = _create_user(db, "alice")
        _add_history(
            db,
            user.id,
            days_ago=0,
            attempts_count=2,
            mode=DAILY_GAME_MODE,
            daily_date=date.today(),
        )

        response = client.post("/game/daily", json={"language": "fr"}, headers=_auth_headers(user.id))

        assert response.status_code == 409
        assert response.json()["detail"] == "Défi du jour déjà joué."
    finally:
        db.close()
        clear_overrides()


def _client_with_db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    testing_session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = testing_session()
    api.games.clear()

    def override_get_db():
        try:
            yield db
        finally:
            pass

    fastapi_app = api.app.app
    fastapi_app.dependency_overrides[get_db] = override_get_db
    return TestClient(api.app), db, fastapi_app.dependency_overrides.clear


def _create_user(db, username: str) -> User:
    user = User(
        username=username,
        email=f"{username}@example.com",
        hashed_password="not-used",
        created_at=datetime.today() - timedelta(days=10),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _add_history(
    db,
    user_id: int,
    days_ago: int,
    attempts_count: int,
    is_won: bool = True,
    mode: str = "classic",
    daily_date: date | None = None,
    multiplier: int = 1,
):
    db.add(GameHistory(
        user_id=user_id,
        secret_word="ARBRE",
        attempts_count=attempts_count,
        is_won=is_won,
        score=compute_game_score(is_won, attempts_count, multiplier=multiplier),
        language="fr",
        mode=mode,
        daily_date=daily_date,
        created_at=datetime.combine(
            datetime.today().date() - timedelta(days=days_ago),
            datetime.min.time(),
        ),
    ))
    db.commit()


def _auth_headers(user_id: int) -> dict[str, str]:
    token = create_access_token({"sub": str(user_id)})
    return {"Authorization": f"Bearer {token}"}
