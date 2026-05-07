from fastapi.testclient import TestClient

import api
from tests.fakes.fake_dictionary import FakeDictionary


def test_winning_guess_and_game_over_error_keep_cors_headers():
    api.games.clear()
    previous_dictionary = api.DICTIONARIES["fr"]
    api.DICTIONARIES["fr"] = FakeDictionary(secrets=["ARBRE"])

    try:
        client = TestClient(api.app)
        headers = {"Origin": "http://127.0.0.1:5173"}

        created = client.post("/game", json={"language": "fr"}, headers=headers)
        game_id = created.json()["game_id"]

        won = client.post(f"/game/{game_id}/guess", json={"word": "ARBRE"}, headers=headers)
        assert won.status_code == 200
        assert won.headers["access-control-allow-origin"] == "http://127.0.0.1:5173"
        assert won.json()["is_over"] is True
        assert won.json()["is_won"] is True

        already_over = client.post(f"/game/{game_id}/guess", json={"word": "ARBRE"}, headers=headers)
        assert already_over.status_code == 422
        assert already_over.headers["access-control-allow-origin"] == "http://127.0.0.1:5173"
        assert already_over.json()["detail"] == "La partie est déjà terminée"
    finally:
        api.DICTIONARIES["fr"] = previous_dictionary
        api.games.clear()
