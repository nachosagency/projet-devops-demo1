# Task Manager : documentation technique et d'exploitation

Application de gestion de tâches : une API Node.js (Express, TypeScript, Prisma) et
un front Vite, avec une base MySQL. Ce document décrit comment la lancer, la tester,
l'intégrer en continu et la déployer.

## Architecture

```
Navigateur ──► front (nginx :80) ──/api──► api (Node :3000) ──► db (MySQL :3306)
```

- Le navigateur ne parle qu'au **front**. nginx sert les fichiers du site et relaie
  les appels `/api/...` vers le service `api`.
- L'**api** est la seule à joindre la **base**. En production, ni l'API ni la base
  ne sont exposées sur Internet.
- Les trois services tournent dans des conteneurs Docker, orchestrés par Docker Compose.

## Prérequis

| Outil | Version |
|---|---|
| Docker et Docker Compose | Docker Desktop récent, ou Docker Engine 25 et plus |
| Node.js, pour travailler hors conteneur | 24 |
| Git | toute version récente |

## Lancer en local

```bash
cp .env.example .env          # puis adapter les mots de passe et les ports si besoin
docker compose up --build     # construit les images et lance db, api et front
```

- Site : http://localhost:8080
- API directe, pour Postman : http://localhost:3000
- Base MySQL depuis le poste : port 3307

Les données sont dans le volume `db_data`. `docker compose down` les conserve,
`docker compose down -v` les efface.

## Tests

```bash
cd api
npm ci
npm run lint                  # qualité du code (ESLint)
npm run test:unit             # tests unitaires, sans base
DATABASE_URL="mysql://taskmanager:change-moi@127.0.0.1:3307/taskmanager" npm test
                              # tous les tests, contre la base du docker compose
```

| Niveau | Fichier | Ce qui est vérifié |
|---|---|---|
| Unitaire | `api/tests/validation.test.ts` | Les règles sur le titre d'une tâche |
| Intégration | `api/tests/tasks.test.ts` | Chaque route de l'API, contre une vraie base |

## Intégration continue

Fichier `.github/workflows/ci.yml`, déclenché à chaque push sur `main` ou `develop`
et à chaque pull request.

| Job | Rôle | Bloquant |
|---|---|---|
| Qualité du code | ESLint et vérification des types | Oui |
| Tests | Migrations puis tests, contre un MySQL fourni par GitHub ; rapport de couverture en artefact | Oui |
| Build du front | Le front se construit sans erreur | Oui |
| Images Docker | Construit et publie les images sur GHCR, seulement si tout est vert et sur un push | — |

Chaque image porte deux tags : `sha-<7 caractères du commit>`, qui ne bouge jamais,
et le nom de la branche, qui suit la dernière version.

## Environnements

| Environnement | Rôle | Branche | Déploiement |
|---|---|---|---|
| Local | Développer | toutes | `docker compose up` |
| Staging (test et acceptation) | Vérifier avant la production, valider avec le client | `develop` | automatique |
| Production | Les utilisateurs | `main` | après validation humaine |

Chaque environnement a son dossier sur le serveur, son `.env`, sa base et son port.
Les images sont les mêmes partout : seule la configuration change.

## Déploiement

### Préparer le serveur, une seule fois

```bash
# Sur le serveur, pour chaque environnement :
sudo mkdir -p /opt/taskmanager/staging && sudo chown "$USER" /opt/taskmanager/staging
cd /opt/taskmanager/staging
nano .env                     # à partir de .env.example : ENVIRONNEMENT, IMAGE_PREFIX, ports, mots de passe

# Autoriser le serveur à lire les images privées (jeton GitHub "read:packages")
echo "<jeton>" | docker login ghcr.io -u <compte-github> --password-stdin
```

### Déployer une version

```bash
bash deploy.sh sha-3f2a1c9
```

Le script récupère les images, démarre la base, applique les migrations, remplace
les conteneurs puis vérifie `/api/health`. Il s'arrête à la première erreur.

Avec le workflow `deploy.yml`, c'est GitHub qui copie la configuration et lance ce
script en SSH, après chaque CI verte sur `develop` ou `main`.

### Revenir à la version précédente

```bash
bash deploy.sh "$(cat .version-precedente)"
```

Une migration de base n'est pas annulée par un retour en arrière. Avant de déployer
une migration destructive, sauvegarder la base.

## Configuration et secrets

| Où | Quoi |
|---|---|
| `.env` sur chaque machine | Mots de passe de la base, ports, nom de l'environnement. Jamais versionné, jamais dans une image |
| Secrets GitHub, par environnement | `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `SSH_KNOWN_HOSTS` |
| Variable GitHub, par environnement | `DOSSIER`, le chemin de l'environnement sur le serveur |
| Automatique | `GITHUB_TOKEN`, pour publier les images sur GHCR |

## En cas de problème

| Symptôme | Où regarder |
|---|---|
| La CI est rouge | L'onglet Actions de GitHub, le job en rouge, la première ligne en erreur |
| Le déploiement échoue | La sortie de `deploy.sh`, qui dit à quelle étape il s'est arrêté |
| Le site ne répond plus | `docker compose -f docker-compose.prod.yml ps`, puis `logs api` |
| L'API répond 503 sur `/health` | La base est injoignable : `logs db` |
