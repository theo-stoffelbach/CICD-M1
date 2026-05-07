"""
API Wordle — FastAPI

Endpoints :
  POST /game              → Créer une nouvelle partie
  POST /game/{id}/guess   → Soumettre un mot
  GET  /game/{id}         → Consulter l'état de la partie
"""

import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import engine
from domain.errors import GameAlreadyOverError, InvalidWordError, InvalidWordLengthError
from domain.game import Game
from infra.file_dictionary import FileDictionary
from models import Base
from routers import auth, users

app = FastAPI(title="Wordle API")

Base.metadata.create_all(bind=engine)
app.include_router(auth.router)
app.include_router(users.router)

# Autorise tous les origines en développement (frontend servi localement)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dictionnaires disponibles par langue ---
BASE_DIR = Path(__file__).parent
DICTIONARIES = {
    "fr": FileDictionary(BASE_DIR / "secrets_fr.txt", BASE_DIR / "valid_fr.txt"),
    "en": FileDictionary(BASE_DIR / "secrets_en.txt", BASE_DIR / "valid_en.txt"),
}
DEFAULT_LANGUAGE = "fr"

# Stockage en mémoire des parties en cours { game_id: Game }
games: dict[str, Game] = {}


# --- Schémas de requête / réponse ---

class NewGameRequest(BaseModel):
    language: str = DEFAULT_LANGUAGE  # "fr" ou "en"

class NewGameResponse(BaseModel):
    game_id: str
    language: str

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
    attempts: list[AttemptItem]
    secret_word: str | None    # révélé uniquement quand la partie est terminée

class GameStateResponse(BaseModel):
    is_over: bool
    is_won: bool
    attempts_left: int
    attempts: list[AttemptItem]
    secret_word: str | None    # révélé uniquement quand la partie est terminée


# --- Endpoints ---

@app.post("/game", response_model=NewGameResponse)
def create_game(body: NewGameRequest):
    """Démarre une nouvelle partie dans la langue choisie."""
    if body.language not in DICTIONARIES:
        raise HTTPException(
            status_code=400,
            detail=f"Langue inconnue : '{body.language}'. Langues disponibles : {list(DICTIONARIES.keys())}"
        )

    game_id = str(uuid.uuid4())
    games[game_id] = Game(DICTIONARIES[body.language])
    return NewGameResponse(game_id=game_id, language=body.language)


@app.post("/game/{game_id}/guess", response_model=GuessResponse)
def guess(game_id: str, body: GuessRequest):
    """Soumet un mot pour la partie en cours."""
    game = _get_game_or_404(game_id)

    try:
        feedback = game.guess(body.word)
    except (InvalidWordError, InvalidWordLengthError, GameAlreadyOverError) as error:
        raise HTTPException(status_code=422, detail=str(error))

    return _build_guess_response(game, feedback)


@app.get("/game/{game_id}", response_model=GameStateResponse)
def get_game_state(game_id: str):
    """Retourne l'état courant de la partie (sans révéler le mot secret)."""
    game = _get_game_or_404(game_id)
    return _build_state_response(game)


# --- Utilitaires ---

def _get_game_or_404(game_id: str) -> Game:
    """Récupère une partie par son ID ou lève une 404."""
    game = games.get(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail=f"Partie '{game_id}' introuvable.")
    return game


def _attempts_to_items(game: Game) -> list[AttemptItem]:
    return [
        AttemptItem(word=a.word.value, feedback=[f.value for f in a.feedback])
        for a in game.attempts
    ]


def _build_guess_response(game: Game, feedback: list) -> GuessResponse:
    return GuessResponse(
        feedback=[f.value for f in feedback],
        is_over=game.is_over,
        is_won=game.is_won,
        attempts_left=game.attempts_left,
        attempts=_attempts_to_items(game),
        secret_word=game.secret_word.value if game.is_over else None,
    )


def _build_state_response(game: Game) -> GameStateResponse:
    return GameStateResponse(
        is_over=game.is_over,
        is_won=game.is_won,
        attempts_left=game.attempts_left,
        attempts=_attempts_to_items(game),
        secret_word=game.secret_word.value if game.is_over else None,
    )
