import pytest

from domain.attempt import Attempt
from domain.errors import GameAlreadyOverError, InvalidWordError, InvalidWordLengthError
from domain.feedback import LetterFeedback
from domain.game import Game
from domain.word import Word
from tests.fakes.fake_dictionary import FakeDictionary


def test_correct_guess_returns_all_correct_feedback():
    # Given
    dictionary = FakeDictionary(["LIVRE"])
    game = Game(dictionary)

    # When
    feedback = game.guess("LIVRE")

    # Then
    assert feedback == [LetterFeedback.CORRECT] * 5


def test_absent_letters_return_absent_feedback():
    # Given
    dictionary = FakeDictionary(["LIVRE", "ZZZZZ"])
    game = Game(dictionary)

    # When
    feedback = game.guess("ZZZZZ")

    # Then
    assert feedback == [LetterFeedback.ABSENT] * 5


def test_misplaced_letter_returns_misplaced_feedback():
    # Given
    dictionary = FakeDictionary(["ABCDE", "BXXXX"])
    game = Game(dictionary)

    # When
    feedback = game.guess("BXXXX")

    # Then
    assert feedback[0] == LetterFeedback.MISPLACED
    assert feedback[1] == LetterFeedback.ABSENT
    assert feedback[2] == LetterFeedback.ABSENT
    assert feedback[3] == LetterFeedback.ABSENT
    assert feedback[4] == LetterFeedback.ABSENT


def test_game_is_won_after_correct_guess():
    # Given
    dictionary = FakeDictionary(["LIVRE"])
    game = Game(dictionary)

    # When
    game.guess("LIVRE")

    # Then
    assert game.is_won is True
    assert game.is_over is True


def test_game_is_over_after_six_wrong_guesses():
    # Given
    dictionary = FakeDictionary(["LIVRE", "ZZZZZ"])
    game = Game(dictionary)

    # When
    for _ in range(6):
        game.guess("ZZZZZ")

    # Then
    assert game.is_over is True
    assert game.is_won is False


def test_guess_after_game_over_raises_error():
    # Given
    dictionary = FakeDictionary(["LIVRE"])
    game = Game(dictionary)
    game.guess("LIVRE")

    # When / Then
    with pytest.raises(GameAlreadyOverError):
        game.guess("LIVRE")


def test_guess_with_wrong_length_raises_error():
    # Given
    dictionary = FakeDictionary(["LIVRE"])
    game = Game(dictionary)

    # When / Then
    with pytest.raises(InvalidWordLengthError):
        game.guess("ABC")


def test_guess_with_invalid_word_raises_error():
    # Given
    dictionary = FakeDictionary(["LIVRE"])
    game = Game(dictionary)

    # When / Then
    with pytest.raises(InvalidWordError):
        game.guess("ZZZZZ")


def test_multiple_same_letters_only_marks_up_to_secret_count():
    # Given - mot secret LIVRE contient un seul R
    dictionary = FakeDictionary(["LIVRE", "RAMER"])
    game = Game(dictionary)

    # When
    feedback = game.guess("RAMER")

    # Then - le premier R est MISPLACED, le second R est ABSENT
    assert feedback == [
        LetterFeedback.MISPLACED,  # R — présent dans LIVRE mais mal placé
        LetterFeedback.ABSENT,     # A — absent
        LetterFeedback.ABSENT,     # M — absent
        LetterFeedback.MISPLACED,  # E — présent dans LIVRE mais mal placé
        LetterFeedback.ABSENT,     # R — déjà consommé, ABSENT
    ]


def test_guess_is_case_insensitive():
    # Given
    dictionary = FakeDictionary(["LIVRE"])
    game = Game(dictionary)

    # When - on soumet en minuscules
    feedback = game.guess("livre")

    # Then - doit fonctionner comme si c'était en majuscules
    assert feedback == [LetterFeedback.CORRECT] * 5


def test_correct_letter_appearing_twice_in_guess_second_occurrence_is_absent():
    # Given - LIVRE contient un seul L
    # LLVRE : le 1er L est CORRECT (bonne position), le 2ème L doit être ABSENT
    dictionary = FakeDictionary(["LIVRE", "LLVRE"])
    game = Game(dictionary)

    # When
    feedback = game.guess("LLVRE")

    # Then
    assert feedback == [
        LetterFeedback.CORRECT,   # L — bonne position
        LetterFeedback.ABSENT,    # L — le seul L du secret est déjà consommé
        LetterFeedback.CORRECT,   # V — bonne position
        LetterFeedback.CORRECT,   # R — bonne position
        LetterFeedback.CORRECT,   # E — bonne position
    ]


def test_game_can_be_won_on_the_sixth_attempt():
    # Given
    dictionary = FakeDictionary(["LIVRE", "ZZZZZ"])
    game = Game(dictionary)

    # When - 5 mauvais essais puis le bon au 6ème
    for _ in range(5):
        game.guess("ZZZZZ")
    feedback = game.guess("LIVRE")

    # Then
    assert feedback == [LetterFeedback.CORRECT] * 5
    assert game.is_won is True


def test_game_is_not_over_after_five_wrong_guesses():
    # Given
    dictionary = FakeDictionary(["LIVRE", "ZZZZZ"])
    game = Game(dictionary)

    # When
    for _ in range(5):
        game.guess("ZZZZZ")

    # Then - il reste encore un essai
    assert game.is_over is False
    assert game.attempts_left == 1


def test_attempts_left_decreases_after_each_guess():
    # Given
    dictionary = FakeDictionary(["LIVRE", "ZZZZZ"])
    game = Game(dictionary)

    # When / Then
    assert game.attempts_left == 6
    game.guess("ZZZZZ")
    assert game.attempts_left == 5
    game.guess("ZZZZZ")
    assert game.attempts_left == 4


def test_guess_with_too_long_word_raises_error():
    # Given
    dictionary = FakeDictionary(["LIVRE"])
    game = Game(dictionary)

    # When / Then
    with pytest.raises(InvalidWordLengthError):
        game.guess("ABCDEF")


def test_guess_with_valid_word_not_in_secrets():
    # Given - "ZZZZZ" est valide mais pas dans les secrets
    dictionary = FakeDictionary(secrets=["LIVRE"], valid_words=["LIVRE", "ZZZZZ"])
    game = Game(dictionary)

    # When
    feedback = game.guess("ZZZZZ")

    # Then - le mot est accepté car dans valid_words, même si pas dans secrets
    assert feedback == [LetterFeedback.ABSENT] * 5


def test_attempts_history_contains_word_and_feedback():
    # Given
    dictionary = FakeDictionary(["LIVRE", "ZZZZZ"])
    game = Game(dictionary)

    # When
    game.guess("ZZZZZ")
    game.guess("LIVRE")

    # Then
    attempts = game.attempts
    assert len(attempts) == 2
    assert isinstance(attempts[0], Attempt)
    assert attempts[0].word == Word("ZZZZZ")
    assert attempts[0].feedback == [LetterFeedback.ABSENT] * 5
    assert attempts[1].word == Word("LIVRE")
    assert attempts[1].feedback == [LetterFeedback.CORRECT] * 5


def test_secret_word_is_typed_as_word():
    # Given
    dictionary = FakeDictionary(["LIVRE"])
    game = Game(dictionary)

    # Then
    assert isinstance(game.secret_word, Word)
    assert game.secret_word.value == "LIVRE"
