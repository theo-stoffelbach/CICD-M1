# User Stories — Wordle CI/CD

## Légende

| Priorité | Signification |
|----------|---------------|
| **P0** | Indispensable pour le rendu |
| **P1** | Important, attendu par le professeur |
| **P2** | Bonus, valorisant si le temps le permet |

---

## 🎮 Features Métier

### 🔴 P0 — Indispensables

#### US-MET-01 : Inscription
> **En tant que** visiteur,  
> **je veux** créer un compte avec un pseudo, email et mot de passe,  
> **afin de** sauvegarder ma progression.

*Critères d'acceptation :*
- Le pseudo et l'email sont uniques.
- Le mot de passe est hashé en base.
- Retourne une erreur claire si le compte existe déjà.

#### US-MET-02 : Connexion
> **En tant que** utilisateur inscrit,  
> **je veux** me connecter avec mon email et mot de passe,  
> **afin de** accéder à mon espace personnel.

*Critères d'acceptation :*
- Retourne un token JWT valide.
- Accès refusé si les identifiants sont incorrects.

#### US-MET-03 : Consulter mon profil
> **En tant que** utilisateur connecté,  
> **je veux** voir mon profil (pseudo, date d'inscription, stats globales),  
> **afin de** connaître mon niveau.

*Stats affichées :* nombre de parties jouées, nombre de victoires, % de réussite.

#### US-MET-04 : Historique de mes parties
> **En tant que** utilisateur connecté,  
> **je veux** consulter l'historique de mes parties précédentes,  
> **afin de** revoir mes coups et mes scores.

*Données stockées par partie :* mot secret, nombre de tentatives, victoire/défaite, score obtenu, date.

---

### 🟡 P1 — Important (compétition & engagement)

#### US-MET-05 : Scoring d'une partie
> **En tant que** joueur,  
> **je veux** gagner des points à chaque partie selon mes performances,  
> **afin de** être classé.

*Règle suggérée :* plus je trouve en peu d'essais, plus le score est haut. Défaite = 0 pts.

#### US-MET-06 : Série de victoires (Streak)
> **En tant que** joueur,  
> **je veux** que ma série de jours consécutifs avec au moins une victoire soit comptabilisée,  
> **afin de** rester motivé à revenir jouer.

#### US-MET-07 : Leaderboard global
> **En tant que** joueur,  
> **je veux** consulter un classement des meilleurs joueurs (score total / meilleure série),  
> **afin de** me comparer aux autres.

---

### 🟢 P2 — Bonus

#### US-MET-08 : Achievements / Badges
> **En tant que** joueur,  
> **je veux** débloquer des succès (ex: "1ère victoire", "Série de 7 jours", "Victoire en 1 coup"),  
> **afin de** valoriser ma progression.

#### US-MET-09 : Intégration frontend-backend
> **En tant qu'** utilisateur,
> **je veux** que le frontend communique avec le backend pour l'authentification, le profil et le jeu,
> **afin de** disposer d'une application fonctionnelle de bout en bout.

*Critères d'acceptation :*
- `auth.html` appelle réellement `/auth/login` et `/auth/register`.
- Le token JWT est stocké en `localStorage` et envoyé dans le header `Authorization`.
- `index.html` envoie le token lors de la création de partie pour lier l'historique au compte.
- `profile.html` affiche les vraies stats et l'historique depuis `/users/me` et `/users/me/history`.

#### US-MET-10 : Défi du jour et classements avancés
> **En tant que** joueur,
> **je veux** jouer un défi quotidien mieux récompensé et consulter plusieurs classements,
> **afin de** me comparer sur différents axes de performance.

*Critères d'acceptation :*
- Un bouton **Défi du jour** lance la partie quotidienne.
- Le défi quotidien utilise le même mot pour tous les joueurs sur une date donnée.
- Une partie quotidienne gagnée rapporte plus de points qu'une partie classique.
- Le profil expose plusieurs classements : score actuel, record de série, score moyen et score du défi du jour.
- Le classement du défi du jour ne prend en compte que les parties quotidiennes de la date courante.

#### US-MET-11 : Accueil de jeu et navigation de fin de partie
> **En tant que** joueur,
> **je veux** arriver sur une page d'accueil qui présente le défi du jour, les classements et les modes de jeu,
> **afin de** choisir rapidement entre une partie classique et le défi quotidien.

*Critères d'acceptation :*
- La page d'accueil permet de lancer une partie classique ou le défi du jour.
- La page d'accueil affiche le classement du défi du jour.
- Le défi du jour n'est proposé qu'une fois par jour pour un joueur connecté.
- La fin de partie propose des actions utiles : rejouer, retour accueil, consulter le classement.
- Le changement de langue reste accessible dans l'écran de jeu, sans être proposé dans la modale de fin de partie.

---

## ⚙️ Features DevOps

### 🔴 P0 — Indispensables

#### US-DEV-01 : Conteneurisation de l'application
> **En tant qu'** équipe de développement,  
> **je veux** containeriser le backend, le frontend et la base de données avec Docker,  
> **afin de** garantir la cohérence des environnements.

*Livrables :* `Dockerfile` (backend + frontend), `docker-compose.yml` fonctionnel en local.

#### US-DEV-02 : Pipeline CI — Tests
> **En tant qu'** équipe de développement,  
> **je veux** que la pipeline CI exécute automatiquement les tests pytest à chaque push,  
> **afin de** ne pas déployer de régression.

#### US-DEV-03 : Pipeline CI — Lint
> **En tant qu'** équipe de développement,  
> **je veux** qu'une étape de lint (ex: `ruff` ou `flake8`) vérifie le style du code,  
> **afin de** maintenir une qualité de code homogène.

#### US-DEV-04 : Pipeline CI — Build
> **En tant qu'** équipe de développement,  
> **je veux** que la pipeline CI construise les images Docker et vérifie qu'elles démarrent,  
> **afin de** détecter les erreurs de build avant le déploiement.

#### US-DEV-05 : Base de données persistée
> **En tant qu'** équipe de développement,  
> **je veux** que les données PostgreSQL soient stockées sur un volume persistant,  
> **afin de** ne pas perdre les comptes et l'historique lors du redémarrage des conteneurs.

#### US-DEV-05.5 : Intégrer la base de données
> **En tant qu'** équipe de développement,  
> **je veux** provisionner un service PostgreSQL dans l'architecture Docker,  
> **afin de** stocker les données métier (utilisateurs, historique, scores).

#### US-DEV-06 : Migrations de base de données
> **En tant qu'** équipe de développement,  
> **je veux** que les migrations Alembic s'exécutent automatiquement au démarrage du backend,  
> **afin de** maintenir le schéma de base à jour.

---

### 🟡 P1 — Important (déploiement & infrastructure)

#### US-DEV-07 : Pipeline CD — Déploiement automatisé
> **En tant qu'** équipe de développement,  
> **je veux** que le déploiement sur l'environnement de production soit automatique après validation de la CI,  
> **afin de** livrer sans intervention manuelle.

#### US-DEV-08 : Orchestrateur de conteneurs
> **En tant qu'** responsable infrastructure,  
> **je veux** déployer l'application via un orchestrateur (ex: Docker Swarm ou Kubernetes),  
> **afin de** gérer le cycle de vie des conteneurs en production.

#### US-DEV-09 : Haute disponibilité du backend
> **En tant qu'** responsable infrastructure,  
> **je veux** que si une VM backend tombe, une autre VM backend prenne automatiquement le relais,  
> **afin de** garantir la continuité de service.

#### US-DEV-10 : Reverse proxy / Load balancer
> **En tant qu'** responsable infrastructure,  
> **je veux** un reverse proxy (ex: Nginx, Traefik) devant les instances backend,  
> **afin de** répartir la charge et exposer un point d'entrée unique.

#### US-DEV-11 : Sécurisation de l'infrastructure
> **En tant qu'** responsable infrastructure,  
> **je veux** que les accès aux VMs se fassent par clé SSH avec un utilisateur dédié,  
> **afin de** sécuriser l'accès au serveur.

#### US-DEV-12 : Gestion des secrets
> **En tant qu'** équipe de développement,  
> **je veux** que les mots de passe et tokens (JWT, DB) ne soient pas en dur dans le code,  
> **afin de** sécuriser l'application (variables d'environnement, Docker secrets, ou vault).

#### US-DEV-13 : Gestion des environnements
> **En tant qu'** équipe de développement,  
> **je veux** séparer les configurations des environnements (dev / staging / prod),  
> **afin de** ne pas impacter la production lors des tests.

---

### 🟢 P2 — Bonus (monitoring & observabilité)

#### US-DEV-14 : Monitoring — Métriques système
> **En tant qu'** responsable infrastructure,  
> **je veux** visualiser les métriques CPU, RAM, disque et réseau des VMs et conteneurs,  
> **afin de** détecter les problèmes de ressources.

*Stack suggérée :* Prometheus + Grafana.

#### US-DEV-15 : Monitoring — Logs centralisés
> **En tant qu'** responsable infrastructure,  
> **je veux** centraliser et consulter les logs de tous les conteneurs depuis une interface unique,  
> **afin de** faciliter le débogage en production.

*Stack suggérée :* Loki + Grafana, ou ELK.

#### US-DEV-16 : Alerting
> **En tant qu'** responsable infrastructure,  
> **je veux** recevoir une alerte (email, webhook, Slack) lorsqu'un service est down ou qu'une métrique dépasse un seuil critique,  
> **afin de** réagir rapidement aux incidents.

*Stack suggérée :* Alertmanager (si Prometheus) ou Uptime Kuma.

#### US-DEV-17 : Healthcheck / Readiness
> **En tant qu'** orchestrateur,  
> **je veux** disposer d'endpoints `/health` et `/ready` sur le backend,  
> **afin de** savoir quand une instance est opérationnelle et recevoir du trafic.

#### US-DEV-18 : Restructuration en architecture multi-services
> **En tant qu'** équipe de développement,  
> **je veux** déplacer le backend dans un dossier `backend/` dédié avec son propre Dockerfile et son `requirements.txt`,  
> **afin de** clarifier l'architecture et faciliter les builds CI/CD indépendants.

*Contexte :* actuellement le backend est à la racine (`api.py`, `domain/`, `infra/`, etc.) tandis que le frontend est isolé dans `frontend/`. Cette asymétrie complique les builds Docker et la maintenance du projet.

*Livrable :* structure propre `backend/`, `frontend/`, `docker-compose.yml` à la racine.

---

## Dépendances logiques

```
[US-MET-01] Inscription  ─┐
[US-MET-02] Connexion    ─┼→ [US-MET-03] Profil + [US-MET-04] Historique
                            ↓
                   [US-MET-05] Scoring → [US-MET-06] Streak → [US-MET-07] Leaderboard
                            ↓
                        [US-MET-08] Achievements

[US-DEV-01] Docker ─→ [US-DEV-02/03/04] CI ─→ [US-DEV-05] Persistence ─→ [US-DEV-06] Migrations
                                                           ↓
                                              [US-DEV-07] CD ─→ [US-DEV-08] Orchestrateur
                                                           ↓
                                    [US-DEV-09] HA + [US-DEV-10] Reverse Proxy
                                                           ↓
                                    [US-DEV-11] SSH + [US-DEV-12] Secrets + [US-DEV-13] Environments
                                                           ↓
                                    [US-DEV-14] Métriques + [US-DEV-15] Logs + [US-DEV-16] Alertes
                                    [US-DEV-18] Restructuration
```
