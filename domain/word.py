import unicodedata

WORD_LENGTH = 5


def _normalize(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if c.isascii()).upper()


class Word:
    """Value object représentant un mot normalisé (majuscules, sans accents)."""

    __slots__ = ("_value",)

    def __init__(self, value: str) -> None:
        self._value = _normalize(value)

    @property
    def value(self) -> str:
        return self._value

    def __eq__(self, other: object) -> bool:
        return isinstance(other, Word) and self._value == other._value

    def __hash__(self) -> int:
        return hash(self._value)

    def __repr__(self) -> str:
        return f"Word({self._value!r})"

    def __len__(self) -> int:
        return len(self._value)
