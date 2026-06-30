# 🎮 Wordle — Application fullstack conteneurisée & CI/CD

**Présentation ~10 min · M1 Ynov · Theo Stoffelbach**

> Fil rouge : *« un push sur `main` arrive en production tout seul, sécurisé et monitoré. »*

---

## ⏱️ Découpage (10 min)

| # | Slide | Durée | Attendu couvert |
|---|-------|-------|-----------------|
| 1 | Intro & démo | 1:00 | — |
| 2 | L'application (fullstack + BDD) | 1:30 | Application |
| 3 | Conteneurisation | 1:00 | Conteneurisée |
| 4 | Infrastructure & sécurité | 1:30 | Sécurité (SSH, user dédié) |
| 5 | Orchestration & déploiement | 1:00 | Orchestrateur |
| 6 | Pipeline CI/CD | 2:00 | Stages + environnements |
| 7 | Monitoring | 1:30 | Métriques / logs / alertes |
| 8 | Bilan & questions | 0:30 | — |

---

## Slide 1 — Intro & démo (1:00)

- Wordle fullstack : deviner un mot de 5 lettres en 6 essais, FR/EN.
- Comptes JWT, scoring, défi du jour, leaderboards, badges.
- **Live** : https://wordle.theo-stoffelbach.fr (faire une partie en 20 s).
- Le vrai sujet n'est pas le jeu, c'est **toute la chaîne autour** : conteneurs → CI/CD → prod → monitoring.

---

## Slide 2 — L'application : fullstack + BDD (1:30)

| Couche | Techno |
|--------|--------|
| **Frontend** | React 19 + Vite + Tailwind, servi par Nginx |
| **Backend** | Python 3.14, FastAPI, SQLAlchemy 2.0 |
| **BDD** | PostgreSQL 16 (prod) / SQLite (dev local) |
| **Auth** | JWT (OAuth2 Bearer), mots de passe hashés |

- **Architecture en couches** : `domain/` = cœur métier **pur** (0 dépendance technique), `infra/` = dictionnaires fichiers, `routers/` = endpoints FastAPI.
- `IDictionary` injectée dans `Game` → testable sans I/O.
- API REST documentée (`/docs` Swagger auto).

> Argument : séparation domaine/infra = code métier testable, indépendant de FastAPI et de la BDD.

---

## Slide 3 — Conteneurisation (1:00)

- **3 services** : `db` (Postgres) · `backend` (FastAPI) · `frontend` (Nginx).
- 2 Dockerfiles dédiés. Backend `python:3.14-slim`, **layers ordonnés** (requirements d'abord = cache pip), exec-form `CMD` (uvicorn = PID 1, signaux propres).
- Frontend : build Vite figé à l'image via `ARG VITE_API_URL` (bonne URL d'API selon l'environnement).
- 2 fichiers d'orchestration selon le contexte :
  - `docker-compose.yml` → dev local
  - `docker-compose.prod.yml` → prod NAS (images GHCR)

---

## Slide 4 — Infrastructure & sécurité (1:30)

**Hébergement** : NAS UGREEN, reverse-proxy Nginx Proxy Manager + SSL Let's Encrypt.

**Sécurité réseau / conteneurs :**
- BDD sur réseau **`internal: true`** → jamais exposée à Internet, aucun port publié.
- Frontend/backend derrière le reverse proxy (TLS) via `webnet`.
- `security_opt: no-new-privileges:true` sur tous les conteneurs.
- `restart: unless-stopped` + limites CPU/RAM (`deploy.resources.limits`).

**Sécurité accès / secrets :**
- Accès serveur par **clé SSH + user dédié non-root** (pas de root, pas de mot de passe).
- Zéro secret hardcodé : tout via `.env` (chmod 600). `SECRET_KEY` absente → l'app **refuse de démarrer** (`RuntimeError`).
- CORS restreint par variable d'env (`CORS_ORIGINS`), pas de wildcard en prod.

---

## Slide 5 — Orchestration & déploiement (1:00)

**Docker Compose orchestre la stack** (`docker-compose.prod.yml`) :
- 3 services coordonnés : `db` → `backend` → `frontend`
- **Dépendances ordonnées** : `depends_on` + `condition: service_healthy` (le backend attend que Postgres soit prêt)
- **Healthchecks** sur les 3 services (`/ready` côté API vérifie la BDD)
- **Auto-restart** : `restart: unless-stopped`
- Limites CPU/RAM par service, BDD sur réseau `internal` (jamais exposée)

**Déploiement continu : Watchtower**
- CD pousse l'image sur GHCR → Watchtower détecte le nouveau tag → `pull` + recréation du conteneur automatiquement
- Label `com.centurylinklabs.watchtower.enable=true` sur backend & frontend

> Fil rouge : *push sur `main` → image GHCR → Watchtower redéploie en prod, sans intervention manuelle.*
> Choix assumé : orchestration **mono-hôte** (stack mono-NAS), pas de cluster Swarm/K8s.

---

## Slide 6 — Pipeline CI/CD (2:00) — *cœur de la présentation*

**CI (`ci.yml`)** — sur push/PR `develop` & `main`, 3 jobs :
1. **Backend** → `ruff check` (lint) + `pytest` (test)
2. **Frontend** → `npm run lint` + `npm run build`
3. **Docker** → `docker compose config` + build des images (dépend des 2 précédents)

**CD (`cd.yml`)** — déclenchée par `workflow_run` **après succès de la CI** :
- Build & **push vers GHCR** (GitHub Container Registry), tags `latest` + SHA du commit.
- **Watchtower** sur le NAS détecte la nouvelle image → pull & redéploiement auto.

**Gestion des environnements :**

| Branche | Tag image | Environnement | URL |
|---------|-----------|---------------|-----|
| `develop` | `:staging` | Staging | wordle-staging.* |
| `main` | `:latest` | Production | wordle.* |

- `workflow_dispatch` manuel avec choix `staging`/`prod`.
- Fichiers `.env` distincts par environnement (`.env.staging.example`).

> Les 4 stages demandés sont là : **lint → test → build → deploy**, avec promotion develop→main.

---

## Slide 7 — Monitoring (1:30)

Stack centralisée sur le NAS : **Prometheus + Grafana + Loki/Promtail + Alertmanager + cAdvisor + Node Exporter**.

- **Métriques applicatives** : middleware FastAPI custom expose `/metrics` (Prometheus) :
  - `http_requests_total{method,path,status}` (Counter)
  - `http_request_duration_seconds` (Histogram de latence)
- **Métriques système** : Node Exporter (CPU/RAM/disque) + cAdvisor (par conteneur).
- **Logs des conteneurs** : Promtail collecte → Loki → exploration dans Grafana.
- **Health/Readiness** : `/health` (liveness) + `/ready` (vérifie la BDD `SELECT 1`) → Docker & Healthcheck Central.
- **Alertes** : Alertmanager (conteneur down, latence/erreurs élevées) → notifications.
- Visualisation : dashboards Grafana (https://monitoring.theo-stoffelbach.fr).

---

## Slide 8 — Bilan (0:30)

- ✅ Fullstack (React + FastAPI + PostgreSQL) **conteneurisé**
- ✅ Infra **sécurisée** (SSH + user dédié, BDD isolée, secrets, no-new-privileges)
- ✅ **Orchestration & déploiement** : Docker Compose (services coordonnés, dépendances par healthcheck, auto-restart) + Watchtower pour le déploiement continu depuis GHCR
- ✅ **CI/CD** 4 stages + staging/prod via GHCR + Watchtower
- ✅ **Monitoring** complet : métriques app & système, logs, alertes

**Démo de secours / questions.**
