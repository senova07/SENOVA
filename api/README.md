# SENOVA — API

AdonisJS 7 + Lucid + MariaDB + Redis (sessions côté serveur, limiteur de débit). Socle multi-organisations (auth par session, rôles et permissions par organisation).

## Lancement

```bash
# depuis la racine du dépôt : MariaDB 11 (bases senova et senova_test) + Redis 7 (requis),
# publiés sur 127.0.0.1 uniquement
docker compose -f docker-compose.dev.yml up -d

cd api
npm install
cp .env.example .env      # puis : node ace generate:key
# renseigner SEED_MOT_DE_PASSE (10 caractères minimum, seeder de démo)
# autres variables : SESSION_DRIVER=redis, REDIS_HOST/PORT/PASSWORD, FRONT_URL (origine CORS en dev)
node ace migration:fresh --seed
npm run dev
```

Comptes de démo (mot de passe = `SEED_MOT_DE_PASSE`) : `demo@senova.fr` (Démo SENOVA) et `autre@senova.fr` (Autre Entreprise).

## Qualité

```bash
npm run typecheck
npm run lint
npm test          # utilise la base senova_test (migrée automatiquement)
```

`npm test` lit `.env` (voir `.env.example`). Sans `.env`, variables à passer dans le même appel shell (APP_KEY : `node ace generate:key --show`) :

```bash
NODE_ENV=test SESSION_DRIVER=memory PORT=3333 HOST=127.0.0.1 LOG_LEVEL=warn APP_URL=http://localhost:3333 MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 MYSQL_USER=senova MYSQL_PASSWORD=senova_dev DB_DATABASE=senova APP_KEY=<clé> npm test
```

En production, `TRUST_PROXY` (IP/CIDR du reverse proxy Caddy) doit être renseignée et `SESSION_DRIVER=redis` est obligatoire.

## Multi-organisation

Toute table métier porte `organisation_id` ; toute requête est filtrée par l'organisation courante.
Voir l'en-tête de `app/models/portee.ts` (scope `deLOrganisation`) et `app/services/acces.ts` (`trouverDansOrganisation`).
