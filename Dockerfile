# ─── Étape 1 : Image de base ─────────────────────────────────────────────────
# python:3.14-alpine = base musl, sans perl-base (paquet Essential de Debian
# trixie, non purgeable, affecté par 4 CVE CRITICAL sans fix au 2026-07-30 :
# CVE-2026-13221, CVE-2026-42496, CVE-2026-57433, CVE-2026-8376).
# Toutes les deps de requirements.txt ont des wheels musllinux (vérifié,
# psycopg2-binary ≥ 2.9.10 inclus) : aucune compilation nécessaire.
FROM python:3.14-alpine

# ─── Étape 2 : Utilisateur non-root ──────────────────────────────────────────
# L'application ne tourne pas en root : utilisateur dédié `app` (audit NAS
# 2026-07-30). Créé AVANT les COPY pour pouvoir l'utiliser dans --chown.
RUN addgroup -S app && adduser -S -G app app

# ─── Étape 3 : Répertoire de travail ─────────────────────────────────────────
# Toutes les commandes suivantes s'exécuteront dans /app
WORKDIR /app

# ─── Étape 4 : Dépendances ───────────────────────────────────────────────────
# On copie D'ABORD requirements.txt seul pour profiter du cache Docker.
# Si requirements.txt ne change pas, le layer pip reste en cache.
COPY --chown=app:app requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ─── Étape 5 : Code source ───────────────────────────────────────────────────
# On copie tout le projet (sauf ce qui est dans .dockerignore)
COPY --chown=app:app . .

# ─── Étape 6 : Port exposé ───────────────────────────────────────────────────
# Documentation : l'application écoute sur le port 8000
EXPOSE 8000

# ─── Étape 7 : Exécution non-root ────────────────────────────────────────────
# L'app n'écrit au pire que dans /tmp : /app peut rester en lecture seule
USER app

# ─── Étape 8 : Commande de démarrage ─────────────────────────────────────────
# Format JSON (exec form) : uvicorn est PID 1, reçoit les signaux proprement
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
