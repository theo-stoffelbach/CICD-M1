# Wordle — TP Tests Unitaires (M1 Ynov)

> 🔗 Dépôt Git : [github.com/ThaoK31/Test_et_tests_unitaires](https://github.com/ThaoK31/Test_et_tests_unitaires)

Projet Wordle complet avec architecture domaine pur, tests exhaustifs, API FastAPI et frontend vanilla.

## Prérequis

- Python 3.10+
- Un navigateur web

## Installation

```bash
# Cloner le repo
git clone https://github.com/ThaoK31/Test_et_tests_unitaires.git
cd Test_et_tests_unitaires/tp_wordle

# Créer et activer le venv
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS / Linux

# Installer les dépendances
pip install -r requirements.txt
```

## Lancer les tests

```bash
pytest tests/ -v
```

Couverture :
```bash
pytest tests/ --cov=domain -v
```

## Lancer l'application

### 1. Démarrer l'API

```bash
uvicorn api:app --reload
```

L'API est disponible sur `http://localhost:8000`.

Endpoints :
- `POST /game` — Créer une partie
- `POST /game/{id}/guess` — Soumettre un mot
- `GET /game/{id}` — État de la partie (avec historique des tentatives)

### 2. Ouvrir le frontend

Ouvrir directement `frontend/index.html` dans votre navigateur :

```bash
start frontend/index.html         # Windows
open frontend/index.html          # macOS
xdg-open frontend/index.html      # Linux
```

Le frontend se connecte automatiquement à `http://localhost:8000`.

## Fonctionnalités

- 🎮 Partie classique Wordle (6 tentatives, mots de 5 lettres)
- 🟩🟨⬛ Feedback CORRECT / MISPLACED / ABSENT
- 🔤 Lettres multiples gérées scrupuleusement
- 🌍 Deux langues : Français et Anglais
- ⌨️ Clavier virtuel + support clavier physique
- ✨ Animations flip, shake, pop
- 🏆 Modales victoire / défaite avec révélation du mot

## Architecture

Le projet suit une architecture en couches avec séparation stricte métier / infra :

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
│   ├── fakes/fake_dictionary.py   # Doublure de test
│   └── test_game.py             # Tests Given/When/Then
├── frontend/
│   └── index.html       # Jeu jouable en vanilla JS
├── api.py               # FastAPI (thin layer)
├── valid_fr.txt / valid_en.txt
├── secrets_fr.txt / secrets_en.txt
└── README.md
```

## Règles du jeu

- Le système choisit un mot secret de 5 lettres.
- Le joueur a 6 tentatives pour le deviner.
- Après chaque tentative, chaque lettre reçoit un feedback :
  - **CORRECT** 🟩 — bonne lettre, bonne place
  - **MISPLACED** 🟨 — bonne lettre, mauvaise place
  - **ABSENT** ⬛ — lettre absente du mot secret
- Si une lettre apparaît plusieurs fois dans la proposition mais moins de fois dans le secret, les occurrences en trop sont marquées **ABSENT**.

## Dictionnaires

| Langue | Source | Mots valides | Mots secrets |
|--------|--------|-------------|--------------|
| 🇫🇷 FR | Liste originale française | 5 951 | 353 |
| 🇬🇧 EN | [Wordle officiel (NYT)](https://www.nytimes.com/games/wordle/index.html) | 12 972 | 2 315 |

Les accents sont automatiquement normalisés (`café` → `CAFE`).

## Auteur

Projet réalisé dans le cadre du cours **Tests et Tests Unitaires** — M1 Ynov.
