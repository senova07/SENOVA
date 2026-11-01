# SENOVA

SaaS multi-entreprises de gestion pour artisans et TPE (devis, factures, avoirs, paiements, clients, catalogue). Interface en français.

## Stack
- **Front** (`src/`) : React 19, TypeScript 6 strict, Vite 8, react-router 7 (**routeur de données** `createBrowserRouter`), CSS simple (un fichier par composant ou feature), `@phosphor-icons/react`, Vitest + Testing Library (jsdom, `fireEvent`, pas de user-event).
- **API** (`api/`) : AdonisJS 6, Lucid, MariaDB + Redis (Docker, `docker-compose.dev.yml`), tests Japa. Types partagés avec le front via `@shared/*` (`api/shared`).

## Commandes
| Commande | Rôle |
|---|---|
| `npm run dev` | front (port 5173 ; `npx vite --port 5174` si Relook occupe 5173) |
| `npm run typecheck` · `npm run lint` · `npm test` · `npm run build` | à faire passer avant tout commit |
| `cd api && npm run dev` | API (port 3333 ; nécessite `api/.env`) |
| Captures | Playwright MCP `browser_run_code_unsafe` avec `scripts/captures/captures.js` (API simulée, 1440×900, sortie `docs/captures/apres/`) |

## Architecture (front)
```
src/app/        routes (App.tsx), AppLayout, gardes de route, PageErreur, isolation des démos
src/ui/         composants génériques sans métier (Bouton, Menu/MenuLigne, Compteurs, ChampRecherche, Dialogue,
                PanneauLateral, Atelier, Logo, GardeModifications, Tableau.css…) ; un CSS par composant
src/lib/        fonctions pures testées (format, texte, couleur)
src/styles/     tokens.css (SEULE source des couleurs, rayons, ombres, polices) + base.css
src/services/   client HTTP et API réelles (articles, clients, session)
src/store/      contextes session et toasts
src/features/   shell (coque), articles (+ import/), clients, devis, documents (rendu/ + apparence/)
src/pages/      Aujourd'hui, connexion, « Bientôt »
```
Ordre du CSS (`main.tsx`) : tokens, base, styles transverses (`ui/Tableau.css`, `styles/ui.css`), puis les CSS des composants et des écrans, importés par leur composant. Les classes d'un écran portent son préfixe (`liste-devis__…`) : tout le CSS est chargé d'un coup, deux écrans ne partagent jamais un nom de classe.

Frontières :
- une feature n'importe pas une autre feature, **sauf** par un index public : `@/features/documents` (rendu + charte) et `@/features/devis` (types, démos, fonctions pures) ; jamais leurs fichiers internes. `src/app/` (routes) importe les pages des features ; `src/app/` et `src/pages/` lisent les données par ces index ;
- une fonction générique (texte, format) va dans `src/lib/` avec son test, pas dans une feature ;
- `ui/` et `lib/` n'importent aucune feature ;
- `features/documents/rendu` est un rendu **pur** (aucun état global ni API) : il servira à la génération PDF ; les totaux lui arrivent calculés, montants positifs.

## Données : front d'abord
Devis, apparence et réglages des documents n'ont **pas encore d'API**. Chaque feature passe par son `api.ts` (fonctions asynchrones, `demo: true`, endpoint attendu en commentaire) ; brancher le back-end = remplacer l'intérieur de ces fonctions. L'interface dit honnêtement ce qui est en démo. **Ne jamais simuler un envoi ou une création.** Liste des endpoints à créer : `docs/REFONTE.md` §4.

## Conventions
- Noms en **français** (comme l'API). TypeScript strict, aucun `any`.
- Composants courts (< ~200 lignes), une responsabilité ; la logique (totaux, TVA, remises, acompte, couleurs, contraste, import CSV) dans des fonctions pures testées.
- Aucune couleur en dur hors `tokens.css` (exception : palettes des documents, qui sont des données) ; pas de style inline sauf variable CSS dynamique.
- Accessibilité : libellés, rôles ARIA, clavier, focus visible, contrastes AA.
- Modifications non enregistrées : `<GardeModifications actif=… />`. Calques (dialogues, panneaux) : `useCalque` (pile, Échap au calque du dessus).
- SaaS : navigation filtrée par permissions (`peut`) ; un **super admin plateforme** est prévu (back-end à faire) ; pas de sélecteur d'entreprise dans la barre latérale.

## Direction artistique
Source de vérité : `design-reference/senova-maquette/` (README + sources) ; rendu : `design-reference/senova.html` (minifié, ne jamais en copier de code) ; captures : `docs/captures/maquette/`.
- Thème clair uniquement. Marine `#0C2A52`, turquoise `#16B8B0` avec parcimonie (~80 % neutre, 15 % marine, 5 % turquoise). Police Geist.
- Rayons 5 / 7 / 9 px. Pas de pilule (sauf interrupteur), pas de grosses cartes (compteurs en texte, sections à filet).
- Icônes Phosphor jamais dans un carré ou un cercle.
- Barre latérale reproduite à l'identique de la maquette (coordonnées SVG comprises) : ne pas la réinterpréter.
- Vérifier visuellement par capture à 1440×900 contre la maquette avant de conclure.

## Agents du projet (`.claude/agents/`)
`auditeur` (lecture seule, preuves avant suppression), `architecte` (arborescence, CLAUDE.md), `design-system` (tokens, `ui/`, coque), `integrateur-ecrans` (un écran à la fois), `relecteur-qa` (relecture + captures). Les agents ne modifient jamais l'index git : seul l'orchestrateur commite.

## Documentation
`docs/AUDIT.md` (audit initial et décisions), `docs/REFONTE.md` (supprimé / déplacé / réécrit / à brancher).
