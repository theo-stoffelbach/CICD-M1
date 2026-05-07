# ─── Étape 1 : Image de base ─────────────────────────────────────────────────
# nginx:alpine = serveur web ultra-léger pour fichiers statiques
FROM nginx:alpine

# ─── Étape 2 : Copier les fichiers du frontend ───────────────────────────────
# On remplace la page par défaut de Nginx par notre Wordle
COPY index.html /usr/share/nginx/html/
COPY auth.html /usr/share/nginx/html/
COPY profile.html /usr/share/nginx/html/
COPY src/ /usr/share/nginx/html/src/

# ─── Étape 3 : Configuration personnalisée ────────────────────────────────────
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ─── Étape 4 : Port exposé ───────────────────────────────────────────────────
EXPOSE 80
