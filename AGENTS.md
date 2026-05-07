# AGENTS.md — TP Wordle

## Contexte

Projet pédagogique M1 Ynov — module **Tests et Tests Unitaires**.  
Objectif : implémenter le jeu Wordle avec une architecture domaine pur, des tests exhaustifs, et une application fonctionnelle (API + frontend).

## Stack technique réelle

- **Langage** : Python 3.14+
- **Tests** : pytest + pytest-cov
- **API** : FastAPI (thin layer)
- **Frontend** : HTML / CSS / JS vanilla (pas React/Vite finalement)
- **Dictionnaire** : `wordfreq` (offline, ~30k mots FR / ~38k mots EN de 5 lettres)

## Architecture

```
tp_wordle/
├── domain/              # Cœur métier, 0 dépendance technique
│   ├── word.py          # Value object Word (validation 5 lettres)
│   ├── feedback.py      # Enum LetterFeedback
│   ├── attempt.py       # Attempt = word + feedback
│   ├── game_state.py    # État complet d'une partie
│   ├── dictionary.py    # IDictionary (ABC)
│   ├── game.py          # Logique de partie
│   └── errors.py        # Erreurs métier typées
├── infra/
│   └── file_dictionary.py   # Implémentation IDictionary via fichiers .txt
├── tests/
│   ├── fakes/fake_dictionary.py
│   └── test_game.py
├── frontend/
│   └── index.html       # Jeu jouable en vanilla JS
├── api.py               # FastAPI
├── valid_fr.txt / valid_en.txt
├── secrets_fr.txt / secrets_en.txt
└── README.md
```

## Principes de conception

- Le **domaine** n'importe jamais `fastapi`, `open`, `print`, `requests`, etc.
- `IDictionary` est injectée dans `Game` via le constructeur.
- Les tests utilisent **toujours** `FakeDictionary`, jamais `FileDictionary`.
- Les erreurs métier ont des types dédiés (`InvalidWordError`, `InvalidWordLengthError`, `GameAlreadyOverError`).
- Les mots sont normalisés (accents retirés) via `_normalize()`.

## État d'avancement

- [x] Domaine pur (`domain/`)
- [x] Tests avec Given/When/Then + FakeDictionary
- [x] Infra `FileDictionary` + fichiers de mots
- [x] API FastAPI avec CORS
- [x] Frontend vanilla fonctionnel (board, clavier, animations, modales)
- [x] Dictionnaires larges FR/EN via `wordfreq`
- [x] README.md
- [x] AGENTS.md

## Commandes utiles

```bash
# Tests
pytest tests/ -v

# API
uvicorn api:app --reload

# Frontend
Ouvrir frontend/index.html dans le navigateur (l'API doit tourner sur :8000)
```

## Points de vigilance

- Ne pas importer de dépendances techniques dans `domain/`.
- `FakeDictionary` doit rester déterministe (`get_random_word` retourne toujours le premier secret).
- La normalisation des accents est faite dans `_normalize()` (domain/game.py + infra/file_dictionary.py).
- `valid_*.txt` contient les mots acceptés comme tentatives ; `secrets_*.txt` contient les mots pouvant être tirés comme secret.
