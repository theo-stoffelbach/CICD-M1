from domain.dictionary import IDictionary


class FakeDictionary(IDictionary):
    def __init__(self, secrets: list[str], valid_words: list[str] | None = None) -> None:
        """
        secrets     : mots pouvant être tirés comme mot secret (get_random_word retourne le premier)
        valid_words : mots acceptés comme tentatives (par défaut = secrets, pour la rétro-compatibilité)
        """
        self._secrets = [w.upper() for w in secrets]
        self._valid_words = [w.upper() for w in (valid_words if valid_words is not None else secrets)]

    def get_random_word(self) -> str:
        return self._secrets[0]

    def is_valid_word(self, word: str) -> bool:
        return word.upper() in self._valid_words
