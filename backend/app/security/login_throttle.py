"""Basic protection against repeated failed login attempts.

This is a per-process limit. Production deployments also need
shared rate limiting at the gateway or authentication service.
"""

from collections import deque
from threading import Lock
from time import monotonic

MAX_FAILURES = 10
WINDOW_SECONDS = 300
MAX_KEYS = 10000

_failures: dict[tuple[str, str], deque[float]] = {}
_lock = Lock()


def _trim(attempts: deque[float], now: float) -> None:
    while attempts and now - attempts[0] > WINDOW_SECONDS:
        attempts.popleft()


def is_blocked(ip: str, username: str) -> bool:
    key = (ip, username.strip().lower())
    now = monotonic()

    with _lock:
        attempts = _failures.get(key)

        if attempts is None:
            return False

        _trim(attempts, now)

        if not attempts:
            del _failures[key]
            return False

        return len(attempts) >= MAX_FAILURES


def record_failure(ip: str, username: str) -> None:
    key = (ip, username.strip().lower())
    now = monotonic()

    with _lock:
        attempts = _failures.setdefault(key, deque())
        _trim(attempts, now)
        attempts.append(now)

        if len(_failures) > MAX_KEYS:
            _failures.pop(next(iter(_failures)))


def clear_failures(ip: str, username: str) -> None:
    with _lock:
        _failures.pop((ip, username.strip().lower()), None)
