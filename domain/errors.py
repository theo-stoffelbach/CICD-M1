class InvalidWordLengthError(Exception):
    def __init__(self, word: str, expected_length: int):
        super().__init__(f'"{word}" ne fait pas {expected_length} lettres')


class InvalidWordError(Exception):
    def __init__(self, word: str):
        super().__init__(f'"{word}" n\'est pas dans le dictionnaire')


class GameAlreadyOverError(Exception):
    def __init__(self) -> None:
        super().__init__("La partie est déjà terminée")
