from domain.attempt import Attempt
from domain.dictionary import IDictionary
from domain.errors import GameAlreadyOverError, InvalidWordError, InvalidWordLengthError
from domain.feedback import LetterFeedback
from domain.game_state import GameState
from domain.word import WORD_LENGTH, Word, _normalize

MAX_ATTEMPTS = 6


class Game:
    def __init__(self, dictionary: IDictionary) -> None:
        self._dictionary = dictionary
        self._secret_word = Word(dictionary.get_random_word())
        self._attempts: list[Attempt] = []
        self._won = False

    @property
    def is_over(self) -> bool:
        return self._won or len(self._attempts) >= MAX_ATTEMPTS

    @property
    def is_won(self) -> bool:
        return self._won

    @property
    def attempts_left(self) -> int:
        return MAX_ATTEMPTS - len(self._attempts)

    @property
    def secret_word(self) -> Word:
        return self._secret_word

    @property
    def attempts(self) -> list[Attempt]:
        return self._attempts.copy()

    def get_state(self) -> GameState:
        return GameState(
            is_over=self.is_over,
            is_won=self.is_won,
            attempts_left=self.attempts_left,
            attempts=self.attempts,
            secret_word=self.secret_word if self.is_over else None,
        )

    def guess(self, word: str) -> list[LetterFeedback]:
        if self.is_over:
            raise GameAlreadyOverError()

        normalized = _normalize(word)

        if len(normalized) != WORD_LENGTH:
            raise InvalidWordLengthError(normalized, WORD_LENGTH)

        if not self._dictionary.is_valid_word(normalized):
            raise InvalidWordError(normalized)

        feedback = self._compute_feedback(normalized)
        self._attempts.append(Attempt(word=Word(normalized), feedback=feedback))

        if all(f == LetterFeedback.CORRECT for f in feedback):
            self._won = True

        return feedback

    def _compute_feedback(self, word: str) -> list[LetterFeedback]:
        secret = self._secret_word.value
        result = [LetterFeedback.ABSENT] * WORD_LENGTH

        # Passe 1 : CORRECT + comptage des lettres restantes du secret
        remaining: dict[str, int] = {}
        for i, (guessed, secret_letter) in enumerate(zip(word, secret)):
            if guessed == secret_letter:
                result[i] = LetterFeedback.CORRECT
            else:
                remaining[secret_letter] = remaining.get(secret_letter, 0) + 1

        # Passe 2 : MISPLACED pour les lettres non-CORRECT
        for i, guessed in enumerate(word):
            if result[i] == LetterFeedback.CORRECT:
                continue
            if remaining.get(guessed, 0) > 0:
                result[i] = LetterFeedback.MISPLACED
                remaining[guessed] -= 1

        return result
