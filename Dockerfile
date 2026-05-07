# ─── Étape 1 : Image de base ─────────────────────────────────────────────────
# python:3.14-slim = version stable, légère, sans outils de dev inutiles
FROM python:3.14-slim

# ─── Étape 2 : Répertoire de travail ─────────────────────────────────────────
# Toutes les commandes suivantes s'exécuteront dans /app
WORKDIR /app

# ─── Étape 3 : Dépendances ───────────────────────────────────────────────────
# On copie D'ABORD requirements.txt seul pour profiter du cache Docker.
# Si requirements.txt ne change pas, le layer pip reste en cache.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ─── Étape 4 : Code source ───────────────────────────────────────────────────
# On copie tout le projet (sauf ce qui est dans .dockerignore)
COPY . .

# ─── Étape 5 : Port exposé ───────────────────────────────────────────────────
# Documentation : l'application écoute sur le port 8000
EXPOSE 8000

# ─── Étape 6 : Commande de démarrage ─────────────────────────────────────────
# Format JSON (exec form) : uvicorn est PID 1, reçoit les signaux proprement
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
