import random
import unicodedata
from pathlib import Path

from domain.dictionary import IDictionary


def _normalize(word: str) -> str:
    nfkd = unicodedata.normalize("NFKD", word)
    return "".join(c for c in nfkd if c.isascii()).upper()


class FileDictionary(IDictionary):
    def __init__(self, secrets_file: str | Path, valid_words_file: str | Path) -> None:
        self._secrets = self._load(secrets_file)
        self._valid_words = self._load(valid_words_file)

    def _load(self, filepath: str | Path) -> list[str]:
        with open(filepath, encoding="utf-8") as f:
            return [line.strip().upper() for line in f if line.strip()]

    def get_random_word(self) -> str:
        return random.choice(self._secrets)

    def is_valid_word(self, word: str) -> bool:
        return _normalize(word) in self._valid_words
