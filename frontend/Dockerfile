# ─── Étape 1 : Image de base ─────────────────────────────────────────────────
# nginx:alpine = serveur web ultra-léger pour fichiers statiques
FROM nginx:alpine

# ─── Étape 2 : Copier les fichiers du frontend ───────────────────────────────
# On remplace la page par défaut de Nginx par notre Wordle
COPY index.html /usr/share/nginx/html/
COPY auth.html /usr/share/nginx/html/
COPY profile.html /usr/share/nginx/html/
COPY src/ /usr/share/nginx/html/src/

# ─── Étape 3 : Configuration personnalisée (optionnel mais propre) ───────────
# On supprime le cache pour éviter que le navigateur garde vieilles versions
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \\.(js|css|html)$ { \
        add_header Cache-Control "no-cache"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# ─── Étape 4 : Port exposé ───────────────────────────────────────────────────
EXPOSE 80
