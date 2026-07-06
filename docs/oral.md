# Notes orales — Projet CI/CD Wordle · M1 Ynov

> Ce fichier contient le texte à dire à l'oral pour chaque diapositive de la présentation.
> La présentation compte 9 slides numérotées dans l'ordre de passage.

---

## Slide 1 — Page de garde

Bonjour, nous allons vous présenter notre projet CI/CD.

Nous avons repris le Wordle développé dans le module **Tests et Tests Unitaires** pour le transformer en une application fullstack complète, conteneurisée, avec une chaîne CI/CD automatisée déployée en production sur un **NAS Ugreen personnel**.

La stack couvre le backend FastAPI en Python 3.14, le frontend React 19, une base PostgreSQL 16, et tout l'outillage DevOps que vous allez découvrir : GitHub Actions, GHCR, Watchtower, Nginx Proxy Manager, et une stack monitoring complète.

---

## Slide 2 — Architecture globale

Notre stack tourne entièrement sur un **NAS Ugreen personnel**.

Le trafic entre via **Nginx Proxy Manager** qui assure le SSL Let's Encrypt et le routing par sous-domaine. Le frontend React et l'API FastAPI communiquent sur le réseau Docker `webnet`. La base PostgreSQL est sur un réseau interne **isolé**, inaccessible depuis l'extérieur.

Côté déploiement : GitHub Actions build et pousse les images sur **GHCR**, puis **Watchtower** sur le NAS détecte la nouvelle image toutes les 5 minutes et redémarre les containers automatiquement — zéro intervention manuelle de notre part.

---

## Slide 3 — Pipeline CI

La CI se déclenche sur chaque **push et pull request** vers develop et main.

Trois jobs tournent en parallèle :
- Le backend lance **Ruff** pour le lint et **pytest** pour les tests unitaires.
- Le frontend lance **ESLint** pour le lint et **Vite build** pour valider la compilation.
- Le job Docker attend les deux premiers, valide le compose YAML, puis construit les images.

Back et front tournent simultanément, ce qui ramène le temps total à environ **3 minutes**. Aucun secret n'est requis pour la CI — seule la CD a besoin de droits GHCR.

---

## Slide 4 — Pipeline CD

La CD utilise le déclencheur **workflow_run** plutôt qu'un simple push trigger.

La raison est simple : avec un trigger `push`, la CI et la CD démarrent **en parallèle** — on peut builder et pousser une image dont les tests n'ont pas encore fini. Avec `workflow_run`, la CD attend que la CI soit **verte** avant de démarrer.

On checkout ensuite exactement le **SHA validé** par la CI. On build avec buildx et on pousse sur GHCR avec deux tags : **:latest** pour que Watchtower le détecte automatiquement, et **:sha** pour la traçabilité et un éventuel rollback.

On a aussi ajouté **workflow_dispatch** pour tester la CD manuellement depuis l'onglet Actions de GitHub.

---

## Slide 5 — Features métier

Toutes les **8 features requises** par le barème sont implémentées.

Inscription et connexion avec **JWT + bcrypt**, profil avec vraies statistiques calculées depuis la base PostgreSQL, historique des parties persisté, scoring selon le nombre de tentatives, streak quotidien qui se réinitialise si un jour est manqué, leaderboard global avec plusieurs classements, et le système d'**achievements** avec badges débloquables automatiquement.

Le tout est intégré dans le frontend React : le token JWT est stocké en localStorage et envoyé dans le header `Authorization` à chaque requête.

---

## Slide 6 — Infrastructure & Sécurité

Le NAS dispose de services transversaux déjà en production :
- **Nginx Proxy Manager** pour le reverse proxy et SSL automatique Let's Encrypt.
- **Watchtower Central** pour l'auto-update des images depuis GHCR.
- **Healthcheck Central** pour surveiller les containers et les redémarrer en cas de problème.
- Un **Docker Socket Proxy** pour ne jamais exposer le socket Docker directement.
- Une stack monitoring complète que nous détaillons à la slide suivante.

Côté sécurité : `no-new-privileges` est appliqué sur tous les containers, la DB est sur un réseau interne **isolé**, les ports applicatifs ne sont pas exposés publiquement — tout passe par NPM — et les secrets sont dans des **fichiers .env** jamais versionnés.

---

## Slide 7 — Monitoring

La stack monitoring est **opérationnelle** sur le NAS.

**Prometheus** collecte les métriques système et des containers via cAdvisor et Node Exporter. **Grafana** offre des dashboards CPU, RAM, réseau, disque en temps réel. **Loki + Promtail** centralise tous les logs des containers — plus besoin de se connecter en SSH pour lire les logs. Et **Alertmanager** envoie des alertes en cas de seuil dépassé ou de container down.

Tout est accessible via des sous-domaines HTTPS sécurisés par Nginx Proxy Manager.

---

## Slide 8 — Justification des choix techniques

Chaque outil a été choisi pour une raison précise :

- **GitHub Actions** : natif au repo, le `GITHUB_TOKEN` donne accès à GHCR automatiquement sans configurer de secret supplémentaire.
- **GHCR** : dans le même écosystème GitHub, gratuit, lié directement au repo — pas de compte externe à gérer.
- **Watchtower** : extrêmement léger sur un NAS, zéro configuration, il suffit d'un label sur le container. Pas besoin de Kubernetes.
- **FastAPI** : réutilise notre code du module Tests précédent, avec l'avantage de l'async natif et de la doc OpenAPI auto-générée.
- **React 19 + Vite** : migration naturelle depuis le vanilla JS, builds ultra-rapides, hot reload en dev.
- **PostgreSQL** : robustesse ACID en production, image alpine légère, support natif SQLAlchemy.
- **NPM (Nginx Proxy Manager)** : déjà installé sur le NAS avec une UI simple, gestion Let's Encrypt en quelques clics.

---

## Slide 9 — Bilan vs barème

En conclusion, voici notre auto-évaluation honnête face aux critères du barème :

- **Pipeline CI** : complète — lint, tests, build parallélisés, 3 jobs distincts avec dépendances explicites.
- **Déploiement automatisé** : pipeline CD opérationnelle avec `workflow_run`, push GHCR automatique et déploiement via Watchtower sans intervention manuelle.
- **Gestion des environnements** : environnement dev opérationnel, secrets externalisés, DB isolée.
- **Choix DevOps justifiés** : chaque outil est argumenté avec les alternatives considérées.
- **Features métier** : 8/8 implémentées et intégrées front↔back.
- **Monitoring** : stack Prometheus + Grafana + Loki + Alertmanager opérationnelle sur le NAS.

Merci pour votre attention. Nous sommes disponibles pour vos questions.
