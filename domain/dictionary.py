from abc import ABC, abstractmethod


class IDictionary(ABC):
    @abstractmethod
    def get_random_word(self) -> str:
        ...

    @abstractmethod
    def is_valid_word(self, word: str) -> bool:
        ...
