# Wordle — Projet CI/CD (M1 Ynov)

> 🎮 Jeu Wordle fullstack conteneurisé avec pipeline CI/CD, authentification, scoring et monitoring.

## 🚀 Stack technique

| Couche | Techno |
|--------|--------|
| **Backend** | Python 3.14, FastAPI, SQLAlchemy 2.0 |
| **Frontend** | HTML, CSS, JS vanilla |
| **Base de données** | PostgreSQL (prod) / SQLite (dev local) |
| **Auth** | JWT (OAuth2 Bearer) |
| **Conteneurisation** | Docker, Docker Compose |
| **Tests** | pytest, pytest-cov |
| **CI/CD** | GitHub Actions (à venir) |

---

## 📦 Prérequis

- [Docker](https://www.docker.com/) + Docker Compose
- OU Python 3.14+ pour le dev local

---

## 🐳 Lancer avec Docker (recommandé)

```bash
# Build et démarrage des 3 services (db + backend + frontend)
docker compose up --build -d

# Voir les logs
docker compose logs -f backend

# Arrêter
docker compose down

# Reset total (supprime aussi la BDD)
docker compose down -v
```

**Services démarrés :**
- 🗄️ PostgreSQL → `localhost:5432`
- 🚀 API FastAPI → `http://localhost:8000`
- 🌐 Frontend → `http://localhost`

---

## 💻 Lancer en local (dev)

```bash
# Créer le venv
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS / Linux

# Installer les déps
pip install -r requirements.txt

# Lancer l'API (SQLite par défaut)
uvicorn api:app --reload
```

L'API est disponible sur `http://localhost:8000`.

Pour utiliser PostgreSQL en local :
```bash
$env:DATABASE_URL="postgresql://user:password@localhost/wordle"   # Windows
uvicorn api:app --reload
```

---

## 🧪 Tests

```bash
pytest tests/ -v
pytest tests/ --cov=domain -v
```

---

## 🌐 Endpoints API

### Auth
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/auth/register` | Créer un compte |
| `POST` | `/auth/login` | Se connecter (retourne JWT) |

### Utilisateur (protégé par Bearer)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/users/me` | Profil + stats |
| `GET` | `/users/me/history` | Historique des parties |

### Jeu
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/game` | Créer une partie |
| `POST` | `/game/{id}/guess` | Soumettre un mot |
| `GET` | `/game/{id}` | État de la partie |

**Doc interactive** : `http://localhost:8000/docs`

---

## ✨ Fonctionnalités

- 🎮 Partie classique Wordle (6 tentatives, mots de 5 lettres)
- 🔐 Système de comptes (inscription / connexion JWT)
- 📊 Profil utilisateur avec stats réelles (parties, victoires, score total)
- 📜 Historique des parties sauvegardées
- 🏆 Système de scoring (plus rapide = plus de points)
- 🌍 Deux langues : Français et Anglais
- ⌨️ Clavier virtuel + support clavier physique
- ✨ Animations flip, shake, pop
- 🏆 Modales victoire / défaite

---

## 🏗️ Architecture

```
CICD-M1/
├── domain/              # Cœur métier pur (0 dépendance technique)
│   ├── word.py
│   ├── feedback.py
│   ├── attempt.py
│   ├── game_state.py
│   ├── dictionary.py
│   ├── game.py
│   └── errors.py
├── infra/
│   └── file_dictionary.py
├── routers/             # Endpoints FastAPI
│   ├── auth.py          # Inscription / Login
│   └── users.py         # Profil / Historique
├── models.py            # Modèles SQLAlchemy
├── schemas.py           # Schémas Pydantic
├── database.py          # Connexion DB
├── auth_utils.py        # Hash + JWT
├── api.py               # Point d'entrée FastAPI
├── tests/
│   └── test_game.py
├── frontend/            # Application vanilla JS
│   ├── index.html
│   ├── auth.html
│   ├── profile.html
│   └── Dockerfile
├── Dockerfile           # Image backend
├── docker-compose.yml   # Orchestration complète
├── docs/                # Documentation projet
│   ├── CONSIGNE.md
│   ├── US.md
│   └── GIT_WORKFLOW.md
├── valid_fr.txt / valid_en.txt
├── secrets_fr.txt / secrets_en.txt
└── README.md
```

---

## 🎯 Règles du scoring

| Résultat | Score |
|----------|-------|
| Victoire en 1 coup | 600 pts |
| Victoire en 6 coups | 100 pts |
| Défaite | 0 pt |

Formule : `(7 - nombre_de_tentatives) × 100`

---

## 🗺️ Dictionnaires

| Langue | Mots valides | Mots secrets |
|--------|-------------|--------------|
| 🇫🇷 FR | ~6 000 | ~350 |
| 🇬🇧 EN | ~13 000 | ~2 300 |

Les accents sont normalisés (`café` → `CAFE`).

---

## 👥 Équipe

Projet réalisé dans le cadre du module **CI/CD** — M1 Ynov.
