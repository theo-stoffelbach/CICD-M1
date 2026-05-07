from dataclasses import dataclass

from domain.attempt import Attempt
from domain.word import Word


@dataclass(frozen=True)
class GameState:
    """État complet et immuable d'une partie de Wordle."""

    is_over: bool
    is_won: bool
    attempts_left: int
    attempts: list[Attempt]
    secret_word: Word | None
