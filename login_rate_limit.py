"""Limite des échecs de connexion pour l'unique processus API Wordle."""

from collections import OrderedDict
from collections.abc import Callable
from math import ceil
from threading import Lock
from time import monotonic


class LoginFailureLimiter:
    def __init__(
        self,
        max_failures: int = 5,
        window_seconds: int = 300,
        max_entries: int = 10_000,
        clock: Callable[[], float] = monotonic,
    ) -> None:
        self.max_failures = max_failures
        self.window_seconds = window_seconds
        self.max_entries = max_entries
        self._clock = clock
        self._entries: OrderedDict[str, tuple[int, float]] = OrderedDict()
        self._lock = Lock()

    def retry_after(self, key: str) -> int:
        with self._lock:
            entry = self._active_entry(key, self._clock())
            if entry is None or entry[0] < self.max_failures:
                return 0
            return max(1, ceil(entry[1] - self._clock()))

    def record_failure(self, key: str) -> None:
        with self._lock:
            now = self._clock()
            entry = self._active_entry(key, now)
            if entry is None:
                if len(self._entries) >= self.max_entries:
                    self._entries.popitem(last=False)
                self._entries[key] = (1, now + self.window_seconds)
            else:
                self._entries[key] = (entry[0] + 1, entry[1])
                self._entries.move_to_end(key)

    def clear(self, key: str) -> None:
        with self._lock:
            self._entries.pop(key, None)

    def _active_entry(self, key: str, now: float) -> tuple[int, float] | None:
        entry = self._entries.get(key)
        if entry is not None and entry[1] <= now:
            del self._entries[key]
            return None
        return entry
