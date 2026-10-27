#!/usr/bin/env bash
# Deploie une version precise de l'application, dans le dossier ou se trouve ce script.
#
# Usage    : ./deploy.sh <tag>          exemple : ./deploy.sh sha-3f2a1c9
# Rollback : ./deploy.sh "$(cat .version-precedente)"
#
# Prerequis sur le serveur (une seule fois, voir le README) :
#   - Docker et Docker Compose installes ;
#   - un .env rempli dans ce dossier ;
#   - docker login ghcr.io fait avec un jeton en lecture seule.

# S'arreter a la premiere erreur.
set -euo pipefail
cd "$(dirname "$0")"

TAG="${1:?Usage : ./deploy.sh <tag>}"
[ -f .env ] || { echo "ERREUR : .env absent de $(pwd)"; exit 1; }

# Charger ENVIRONNEMENT, FRONT_PORT, les mots de passe...
set -a
# shellcheck source=/dev/null
. ./.env
set +a
export TAG
compose() { docker compose -f docker-compose.prod.yml "$@"; }

echo "==> 1. Recuperation des images $TAG"
compose pull api front

echo "==> 2. Base de donnees"
compose up -d --wait db

echo "==> 3. Migrations de la base"
compose run --rm api npx prisma migrate deploy

echo "==> 4. Remplacement des conteneurs"
compose up -d --wait

echo "==> 5. Verification"
curl -fsS "http://127.0.0.1:${FRONT_PORT}/api/health"
echo

# Noter les versions, pour pouvoir revenir en arriere.
[ -f .version ] && cp .version .version-precedente
echo "$TAG" > .version
echo "==> Deploye : ${ENVIRONNEMENT} en version ${TAG}"
