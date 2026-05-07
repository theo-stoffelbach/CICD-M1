from dataclasses import dataclass

from domain.feedback import LetterFeedback
from domain.word import Word


@dataclass(frozen=True)
class Attempt:
    """Une tentative du joueur avec le mot proposé et le feedback reçu."""

    word: Word
    feedback: list[LetterFeedback]
