# Image du front, en deux etapes.
# Etape 1 : Node fabrique les fichiers statiques. Etape 2 : nginx les sert.

# ---------- Etape 1 : construction ----------
FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Etape 2 : service ----------
FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
# Sain si nginx sert la page d'accueil. Sinon, Compose le voit « unhealthy ».
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1/ || exit 1
