# Consignes Projet CI/CD — Wordle

## Contexte

Réutilisation du projet **Wordle** (initialement développé dans le module *Tests et Tests Unitaires*) dans le cadre du module **CI/CD**.

- **Groupe** : 2 à 3 étudiants
- **Stack actuelle** : Python 3.14+, FastAPI, pytest, HTML/CSS/JS vanilla
- **Objectif** : transformer l'application en solution fullstack conteneurisée, avec persistance, orchestration et monitoring.

---

## Ce que j'attends

### Application

| Élément | Description |
|---------|-------------|
| **Fullstack** | Front + Back + Base de données |
| **Conteneurisée** | L'ensemble de l'application doit être containerisé (Docker) |
| **Stack libre** | Technos au choix pour la nouvelle infrastructure (BD, reverse proxy, etc.) |

### Nouvelles fonctionnalités (à implémenter)

Pour justifier la présence d'une base de données, les features suivantes sont **requises** :

- **Système de comptes** : inscription / authentification des utilisateurs
- **Historique** : sauvegarde des parties jouées par utilisateur
- **Scoring** : calcul et stockage des scores
- **Série (streak)** : nombre de jours consécutifs avec au moins une victoire
- **Leaderboard** : classement global des meilleurs joueurs
- **Achievements** : badges / succès débloquables

### Infrastructure

| Exigence | Description |
|----------|-------------|
| **Sécurisée** | Accès par clé SSH, utilisateur dédié, bonnes pratiques de sécurité |
| **Orchestrateur** | Déploiement via un orchestrateur de conteneurs (ex: Docker Swarm, Kubernetes, etc.) |
| **Haute disponibilité** | Si la VM backend tombe, une autre VM backend doit automatiquement prendre le relais |

### Chaîne CI/CD

| Élément | Description |
|---------|-------------|
| **Pipeline CI** | Stages obligatoires : lint, test, build |
| **Pipeline CD** | Déploiement automatisé |
| **Gestion des environnements** | Séparation claire des environnements (ex: dev, staging, prod) |

> Les tests pytest existants sont réutilisables. D'autres étapes (lint, sécurité, etc.) peuvent être ajoutées selon les choix du groupe.

### Monitoring

| Élément | Description |
|---------|-------------|
| **Alertes** | Notifications en cas d'anomalie (down, erreurs, etc.) |
| **Métriques système** | CPU, RAM, disque, réseau des VMs / conteneurs |
| **Logs des conteneurs** | Centralisation et visualisation des logs applicatifs |

---

## Ce que j'évalue

1. **Pipeline CI/CD** : qualité, clarté, exhaustivité
2. **Déploiement automatisé** : fiabilité du processus de mise en production
3. **Gestion des environnements** : isolation et configuration des environnements
4. **Choix DevOps justifiés** : chaque outil / techno doit être choisi et argumenté

---

## Livrables attendus

- [ ] Application fonctionnelle avec les nouvelles features (compte, scoring, leaderboard, etc.)
- [ ] Fichiers Docker / Docker Compose / Manifestes d'orchestration
- [ ] Pipelines CI/CD fonctionnelles (fichiers de configuration)
- [ ] Documentation des choix techniques et architecturaux
- [ ] Monitoring et alerting opérationnels
