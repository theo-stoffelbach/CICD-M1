"""
API Wordle — FastAPI

Endpoints :
  POST /game              → Créer une nouvelle partie
  POST /game/{id}/guess   → Soumettre un mot
  GET  /game/{id}         → Consulter l'état de la partie
"""

import logging
import os
import uuid
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette_prometheus import PrometheusMiddleware, metrics
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from auth_utils import get_current_user, get_current_user_optional
from database import engine, get_db
from domain.errors import GameAlreadyOverError, InvalidWordError, InvalidWordLengthError
from domain.game import Game
from engagement import CLASSIC_GAME_MODE, DAILY_GAME_MODE, DAILY_SCORE_MULTIPLIER, compute_game_score
from infra.file_dictionary import FileDictionary
from models import Base, GameHistory
from routers import auth, users

logger = logging.getLogger(__name__)


@dataclass
class GameSession:
    game: Game
    user_id: int | None
    language: str
    mode: str = CLASSIC_GAME_MODE
    daily_date: date | None = None


class FixedWordDictionary:
    def __init__(self, dictionary: FileDictionary, secret_word: str) -> None:
        self._dictionary = dictionary
        self._secret_word = secret_word

    def get_random_word(self) -> str:
        return self._secret_word

    def is_valid_word(self, word: str) -> bool:
        return self._dictionary.is_valid_word(word)


def _ensure_game_history_schema() -> None:
    inspector = inspect(engine)
    if "game_history" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("game_history")}
    with engine.begin() as connection:
        if "mode" not in columns:
            connection.execute(text("ALTER TABLE game_history ADD COLUMN mode VARCHAR DEFAULT 'classic' NOT NULL"))
        if "daily_date" not in columns:
            connection.execute(text("ALTER TABLE game_history ADD COLUMN daily_date DATE"))


app = FastAPI(title="Wordle API")

Base.metadata.create_all(bind=engine)
_ensure_game_history_schema()
app.include_router(auth.router)
app.include_router(users.router)

app.add_middleware(PrometheusMiddleware)
app.add_route("/metrics", metrics)

# --- Dictionnaires disponibles par langue ---
BASE_DIR = Path(__file__).parent
DICTIONARIES = {
    "fr": FileDictionary(BASE_DIR / "secrets_fr.txt", BASE_DIR / "valid_fr.txt"),
    "en": FileDictionary(BASE_DIR / "secrets_en.txt", BASE_DIR / "valid_en.txt"),
}
DEFAULT_LANGUAGE = "fr"

# Stockage en mémoire des parties en cours.
games: dict[str, GameSession] = {}


# --- Schémas de requête / réponse ---

class NewGameRequest(BaseModel):
    language: str = DEFAULT_LANGUAGE  # "fr" ou "en"

class NewGameResponse(BaseModel):
    game_id: str
    language: str
    mode: str
    daily_date: date | None = None

class GuessRequest(BaseModel):
    word: str

class AttemptItem(BaseModel):
    word: str
    feedback: list[str]

class GuessResponse(BaseModel):
    feedback: list[str]        # ex: ["CORRECT", "ABSENT", "MISPLACED", ...]
    is_over: bool
    is_won: bool
    attempts_left: int
    score: int
    mode: str
    daily_date: date | None = None
    attempts: list[AttemptItem]
    secret_word: str | None    # révélé uniquement quand la partie est terminée

class GameStateResponse(BaseModel):
    is_over: bool
    is_won: bool
    attempts_left: int
    mode: str
    daily_date: date | None = None
    attempts: list[AttemptItem]
    secret_word: str | None    # révélé uniquement quand la partie est terminée


# --- Endpoints ---

@app.post("/game", response_model=NewGameResponse)
def create_game(
    body: NewGameRequest,
    current_user = Depends(get_current_user_optional),
):
    """Démarre une nouvelle partie dans la langue choisie."""
    _validate_language(body.language)

    game_id = str(uuid.uuid4())
    games[game_id] = GameSession(
        game=Game(DICTIONARIES[body.language]),
        user_id=current_user.id if current_user else None,
        language=body.language,
    )
    return NewGameResponse(game_id=game_id, language=body.language, mode=CLASSIC_GAME_MODE)


@app.post("/game/daily", response_model=NewGameResponse)
def create_daily_game(
    body: NewGameRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Démarre le défi du jour, identique pour tous les joueurs d'une langue."""
    _validate_language(body.language)
    today = date.today()
    user_id = current_user.id
    if _has_played_daily_challenge(db, user_id, body.language, today):
        raise HTTPException(status_code=409, detail="Défi du jour déjà joué.")

    dictionary = DICTIONARIES[body.language]
    secret_word = dictionary.get_word_for_key(f"{body.language}:{today.isoformat()}")
    game_id = str(uuid.uuid4())
    games[game_id] = GameSession(
        game=Game(FixedWordDictionary(dictionary, secret_word)),
        user_id=user_id,
        language=body.language,
        mode=DAILY_GAME_MODE,
        daily_date=today,
    )
    return NewGameResponse(
        game_id=game_id,
        language=body.language,
        mode=DAILY_GAME_MODE,
        daily_date=today,
    )


@app.post("/game/{game_id}/guess", response_model=GuessResponse)
def guess(
    game_id: str,
    body: GuessRequest,
    db: Session = Depends(get_db),
):
    """Soumet un mot pour la partie en cours."""
    session = _get_game_or_404(game_id)
    if (
        session.mode == DAILY_GAME_MODE
        and session.user_id is not None
        and session.daily_date is not None
        and _has_played_daily_challenge(db, session.user_id, session.language, session.daily_date)
    ):
        raise HTTPException(status_code=409, detail="Défi du jour déjà joué.")

    try:
        feedback = session.game.guess(body.word)
    except (InvalidWordError, InvalidWordLengthError, GameAlreadyOverError) as error:
        raise HTTPException(status_code=422, detail=str(error))

    score = 0
    if session.game.is_over:
        attempts_count = len(session.game.attempts)
        multiplier = DAILY_SCORE_MULTIPLIER if session.mode == DAILY_GAME_MODE else 1
        score = compute_game_score(session.game.is_won, attempts_count, multiplier=multiplier)

    if session.game.is_over and session.user_id is not None:
        try:
            db.add(GameHistory(
                user_id=session.user_id,
                secret_word=session.game.secret_word.value,
                attempts_count=attempts_count,
                is_won=session.game.is_won,
                score=score,
                language=session.language,
                mode=session.mode,
                daily_date=session.daily_date,
            ))
            db.commit()
        except SQLAlchemyError:
            db.rollback()
            logger.exception("Impossible d'enregistrer l'historique de la partie %s", game_id)

    return _build_guess_response(session, feedback, score)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/ready")
def ready(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database not ready: {e}")


@app.get("/game/{game_id}", response_model=GameStateResponse)
def get_game_state(game_id: str):
    """Retourne l'état courant de la partie (sans révéler le mot secret)."""
    session = _get_game_or_404(game_id)
    return _build_state_response(session)


# --- Utilitaires ---

def _validate_language(language: str) -> None:
    if language not in DICTIONARIES:
        raise HTTPException(
            status_code=400,
            detail=f"Langue inconnue : '{language}'. Langues disponibles : {list(DICTIONARIES.keys())}",
        )


def _has_played_daily_challenge(db: Session, user_id: int, language: str, today: date) -> bool:
    return db.query(GameHistory).filter(
        GameHistory.user_id == user_id,
        GameHistory.language == language,
        GameHistory.mode == DAILY_GAME_MODE,
        GameHistory.daily_date == today,
    ).first() is not None


def _get_game_or_404(game_id: str) -> GameSession:
    """Récupère une partie par son ID ou lève une 404."""
    entry = games.get(game_id)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Partie '{game_id}' introuvable.")
    return entry


def _attempts_to_items(game: Game) -> list[AttemptItem]:
    return [
        AttemptItem(word=a.word.value, feedback=[f.value for f in a.feedback])
        for a in game.attempts
    ]


def _build_guess_response(session: GameSession, feedback: list, score: int) -> GuessResponse:
    return GuessResponse(
        feedback=[f.value for f in feedback],
        is_over=session.game.is_over,
        is_won=session.game.is_won,
        attempts_left=session.game.attempts_left,
        score=score,
        mode=session.mode,
        daily_date=session.daily_date,
        attempts=_attempts_to_items(session.game),
        secret_word=session.game.secret_word.value if session.game.is_over else None,
    )


def _build_state_response(session: GameSession) -> GameStateResponse:
    return GameStateResponse(
        is_over=session.game.is_over,
        is_won=session.game.is_won,
        attempts_left=session.game.attempts_left,
        mode=session.mode,
        daily_date=session.daily_date,
        attempts=_attempts_to_items(session.game),
        secret_word=session.game.secret_word.value if session.game.is_over else None,
    )


# Le middleware CORS enveloppe toute l'app ASGI, y compris les réponses 500.
# CORS_ORIGINS : liste d'origines séparées par des virgules (ex: https://wordle.theo-stoffelbach.fr,http://localhost:5173)
_cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
_cors_origins = [o.strip() for o in _cors_raw.split(",") if o.strip()]
app = CORSMiddleware(
    app,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)
