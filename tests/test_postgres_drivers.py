import os
import subprocess
import sys
from pathlib import Path

import pytest


@pytest.mark.parametrize("driver", ["psycopg", "psycopg2"])
def test_database_initializes_postgres_driver_without_connecting(driver):
    """SQLite tests alone do not exercise production's PostgreSQL DBAPI."""
    environment = {
        **os.environ,
        "DATABASE_URL": f"postgresql+{driver}://ci:ci@127.0.0.1:1/ci",
    }
    result = subprocess.run(
        [sys.executable, "-c", "import database; print(database.engine.dialect.driver)"],
        cwd=Path(__file__).resolve().parents[1],
        env=environment,
        capture_output=True,
        text=True,
        timeout=20,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == driver
