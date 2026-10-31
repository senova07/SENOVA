# Audit du front SENOVA (phase 0, lecture seule)

Date : 31/10/2026. Rien n'a été modifié ni supprimé. Ce document attend une validation.

## 0. Décisions prises (31/10)

1. **Sources de la maquette** : copiées dans `design-reference/senova-maquette/`, à partir de `Downloads/senova-maquette (1)/senova`. Le fichier compilé est dans `design-reference/senova.html`.
   - Les sources font 7 600 lignes : 4 pages, `tokens.css`, `base.css`, la sidebar en SVG et un README.
   - Stack : React 19 et Phosphor, comme le projet. **Pas de routeur** (navigation par `#hash`) et pas de tests.
2. **Commit de base** sur `main`, **sans** `docs/design/` (16 Mo de captures). Ces captures ne sont jamais versionnées, puis elles sont supprimées en phase 1.
3. **Devis, factures et apparence n'ont pas d'API.** La priorité est la partie visuelle et l'ergonomie : on garde des données de démo locales, isolées derrière une couche remplaçable (`features/*/api.ts`). Le back-end sera branché plus tard. L'interface indique honnêtement ce qui n'est pas enregistré. On ne touche pas à l'API.
4. **Nommage** : on garde le français, la convention du projet et de l'API.
5. **Navigation** : on adopte celle de la maquette. Les routes réelles qu'elle n'affiche pas restent accessibles : `/devis/modeles` est absorbé par Apparence des documents.
6. **Dépendance `xlsx` (SheetJS)** : la maquette utilise `xlsx@0.18.5` de npm, qui a des failles connues (prototype pollution CVE-2023-30533, ReDoS CVE-2024-22363), et SheetJS ne publie plus sur npm. Ma proposition : **l'import par fichier n'accepte d'abord que CSV/TSV et collage**, analysés sans dépendance. Excel (.xlsx) suivra plus tard avec la version du CDN SheetJS, épinglée. **À valider.**

## 1. Stack réelle

| Domaine | Outil |
|---|---|
| Front | React 19.2, TypeScript 6 strict (`noUncheckedIndexedAccess`, `noUnused*`), Vite 8 |
| Routing | react-router-dom 7, `BrowserRouter`, toutes les routes dans `src/App.tsx` |
| État | Contextes React (`SessionProvider`, `ToastProvider`), `useState` local, un store maison `useSyncExternalStore` pour la démo des devis (`donnees.ts`) |
| Données | `src/services/http.ts` (fetch, cookie de session et XSRF, 401 → déconnexion), puis `articlesApi`, `clientsApi`, `sessionApi`. Types partagés via l'alias `@shared/*` (`api/shared`). |
| Styles | CSS global (`src/styles/{tokens,base,ui,layout,pages}.css`) et un CSS par feature importé par les composants. Pas de Tailwind, de modules CSS ni de SCSS. |
| Icônes | `@phosphor-icons/react` 2.1.10, enveloppé par `src/components/ui/Icone.tsx` |
| Tests | Vitest 4, jsdom, Testing Library : 11 fichiers, 47 tests |
| Lint | ESLint 10 flat config, typescript-eslint, react-hooks, react-refresh. Pas de Prettier côté front. |
| API | AdonisJS 6, Lucid, MariaDB, Redis (Docker), tests Japa. **Hors périmètre.** |

### État de base mesuré

| Contrôle | Résultat |
|---|---|
| `npm run typecheck` | OK |
| `npm run lint` | OK |
| `vite build` | OK. Un seul bundle de 629 ko, avec l'avertissement « > 500 ko ». |
| `npm test` | **KO tel quel.** 5 fichiers sur 11 plantent : les workers vitest manquent de mémoire (« JavaScript heap out of memory »). Avec `--maxWorkers=1`, les 11 fichiers et 47 tests passent. Il ne s'agit pas d'un bug de code. Correctif proposé en phase 1 : `maxWorkers` dans `vite.config.ts`. |
| knip | Impossible à lancer ici. La 5.62 est incompatible avec TS 6, et la 6.43 manque de mémoire. Les preuves d'usage ont donc été faites par `grep` des imports (§3). |

## 2. Arborescence et problèmes

```
src/
  App.tsx              routes + liste PAGES_REELLES à synchroniser à la main
  components/layout/   AppLayout, Sidebar (272 l., 2 menus inline), Header, NavigationMobile, navigation.ts
  components/ui/       Badge, Bouton, Carte, EtatVide, Formulaire, Icone, Logo, MenuDeroulant, Modale, Onglets, Pagination, RubanProgression
  features/articles/   PageArticles (617 l.), ModaleArticle (335), ListeArticles, useCatalogue… → API réelle
  features/clients/    PageClients (464), ModaleClient (523), PageFicheClient (431)… → API réelle + pièces démo
  features/devis/      donnees.ts (547 l.), PageDevis, PageEspaceDevis, PageEditeurModele, ApercuDevis… → 100 % démo
  pages/               PageAujourdhui (démo), PageAuth (API), PageBientot
  services/ store/ hooks/ lib/ styles/
```

Problèmes relevés :

- **Composants géants** (plus de 300 lignes) : `PageArticles` 617, `ModaleClient` 523, `PageClients` 464, `PageDevis` 440, `PageFicheClient` 431, `PageEditeurModele` 428, `PageEspaceDevis` 405, `EditeurLignes` 390, `PageAujourdhui` 384, `ModaleArticle` 335. Chacun mélange filtres, état de plusieurs modales, menus et rendu.
- **`donnees.ts` fait tout** : types métier, constantes, calculs (bien isolés), jeux de démo, store, numérotation fictive `DEV-2026-…` et `nouvelId` via `Math.random`.
- **Duplications** :
  - environ 12 menus `role="menu"` refaits à la main, alors que `MenuDeroulant` existe (utilisé dans 5 fichiers) ;
  - 7 `<table>` écrits à la main ;
  - les 5 pages de liste refont recherche, filtres, pagination et état vide.
- **Styles éparpillés et couplés** :
  - `PageClients` et `PageDevis` importent `articles.css` ;
  - la classe `tableau-articles` sert aussi aux clients, pièces et devis ;
  - environ 90 lignes avec des couleurs en dur hors `tokens.css`, dont 28 dans `layout.css`, 16 dans `ui.css` et 9 dans `PageEditeurModele.tsx` ;
  - 8 `style={{}}`, presque tous dynamiques, donc acceptables.
- **Tokens actuels incompatibles avec la maquette** :
  - navy `#031f3f` / turquoise `#02a6ae` contre `#0B2A50` / `#16B8B0` ;
  - rayon 2 px contre 6 à 10 px ;
  - polices Instrument Sans / Space Grotesk contre Geist.
- **Navigation divergente** :
  - Actuel : Avoirs, Relances, Catégories, Packs, Fournisseurs, Entreprise, Modèles de devis, Facture électronique.
  - Maquette : Prestations, Factures, Paiements, Documents, Dépenses, Partenaires, Équipe, Automatisations, Intégrations, Paramètres. Elle ajoute aussi les compteurs et le sélecteur d'organisation.
- Aucun `any`. Le TypeScript est déjà strict, ce qui est un bon point de départ.

## 3. Fichiers inutiles (preuves)

Méthode : recherche du nom de chaque fichier dans `src/`, `index.html`, `*.md`, `*.json`, `*.ts(x)`, hors `node_modules`.

| Élément | Taille | Preuve | Proposition |
|---|---|---|---|
| `docs/design/captures/*.png` (59 captures d'écran) | ≈ 16 Mo avec le reste de `docs/design` | Aucune référence dans le code ni la doc | **Supprimer** |
| `docs/design/*.png` (28 images : `ref-*`, `flow-*`, `logo-*`, `directions-artistiques`, etc.) | inclus ci-dessus | Aucune référence. Remplacés par la nouvelle maquette. | **Supprimer**. Les logos utiles existent déjà dans `public/`. |
| `.playwright-mcp/` (logs, snapshots, `logo1.png`, `v2.png`) | 355 ko | Ignoré par git, aucune référence | Supprimer du disque |
| `dist/`, `tsconfig.tsbuildinfo` | 872 ko | Sorties de build, ignorées par git | Supprimer du disque |
| `src/components/ui/RubanProgression.tsx` + `etapesParcours.ts` + `RubanProgression.test.tsx` | — | Seul son propre test l'importe. Aucun usage dans l'app. | **Supprimer** |
| `src/features/devis/donnees.ts` : `DEVIS_DEMO`, `MODELES_DEMO`, `FACTURES_DEMO`, `PRESTATIONS_DU_JOUR`, `magasin*` | — | Démo en mémoire. Les écrans Devis, Aujourd'hui et Fiche client en dépendent. | À garder tant que l'API devis n'existe pas (cf. décision 3) |
| `Dossier/` (cahier des charges V3 en .docx et .pdf) | 968 ko | Ce n'est pas une capture : c'est la spécification. | **Garder** (à confirmer) |
| `public/favicon.ico`, `logo-mot.png`, `logo-symbole.png` | — | Utilisés par `index.html` et `Logo.tsx` | Garder. La maquette a son propre logo en SVG, à reprendre en phase 3. |

**Dépendances** : toutes sont utilisées. `@phosphor-icons/react` est utilisé par `Icone.tsx`, `@types/node` par `vite.config.ts` et `@testing-library/jest-dom` par `src/test/setup.ts`. Il n'y a rien à retirer.

## 4. Maquette compilée : écrans → existant

La maquette contient la coque (barre latérale, barre du haut, menu « Nouveau ») et **4 écrans réels**. Les autres entrées de navigation affichent « Écran en préparation ».

| Écran de la maquette | Route maquette | Existant | Action |
|---|---|---|---|
| Coque : barre latérale, barre du haut, menu Nouveau | — | `AppLayout`, `Sidebar`, `Header`, `NavigationMobile` | **Remplacer** |
| Articles : tableau, onglets, compteurs, panneau latéral « Nouvel article », bouton à menu | `#articles` | `/articles` (`PageArticles`, `ModaleArticle`), sur l'API réelle | **Remplacer**, branché sur l'API existante |
| Ajout d'articles en masse : collage, validation, import | `#articles-import` | N'existe pas. L'API n'a pas d'import en lot. | **Créer**. L'import est faisable en boucle sur `POST /articles`. À valider. |
| Nouveau devis : 5 étapes et aperçu A4 | `#devis-nouveau` | `/devis/:id` (`PageEspaceDevis`, `EditeurLignes`, `ApercuDevis`), données démo | **Remplacer**. Garder `calculerTotaux` (testé). Pas d'API. |
| Apparence des documents : 8 modèles, 10 styles de tableau, couleurs, polices… | `#documents-apparence` | `/devis/modeles`, `/devis/modeles/:id` (`PageModelesDevis`, `PageEditeurModele`), données démo | **Remplacer** (fusion des deux écrans). Pas d'API. |
| Rendu des documents (`DocumentPreview`, `DocTable`) | — | `ApercuDevis`, `styleFeuille.ts`, `apercu.css` | **Réécrire** en module autonome `features/documents/rendu` |
| Absents de la maquette | — | Connexion/Inscription, Aujourd'hui, Clients, Fiche client, Liste des devis, PageBientot | **Garder**, avec un passage au nouveau design system sans changer leur fonctionnement |

## 5. Architecture cible

```
src/
  app/            App.tsx (routes), providers, AppLayout
  ui/             composants génériques : Button, Field, Select, Textarea, Switch, Checkbox,
                  Menu, SplitButton, Tabs, Segmented, Dialog, SidePanel, Toast, Table, Icon
  lib/            format (euro, taux), math (arrondi), color (contraste, HSL), http
  styles/         tokens.css (unique source), base.css
  features/
    shell/        Sidebar, Topbar, NewMenu, navigation.ts
    auth/         pages connexion / inscription, session (provider + hook)
    articles/     page, table, filtres, panneau détail, import en masse, api, hooks
    clients/      liste, fiche, modale, api
    devis/        liste, éditeur 5 étapes, logique (totaux, TVA, acompte, remises : pures + testées)
    documents/    rendu/ (DocumentPreview, DocTable, doc.css : autonome, réutilisable pour le PDF)
                  apparence/ (modèles, styles, couleurs, polices, mentions)
    aujourdhui/
```

Conventions proposées :

- **Noms** : le projet nomme tout en français (`PageArticles`, `formaterEuro`, API comprise). La mission demande des noms en anglais sauf convention contraire. **Je propose de garder le français**, pour rester cohérent avec l'API et `@shared` (cf. décision 4).
- **Styles** : un fichier `.css` par composant `ui/` et par feature, avec des classes BEM courtes et uniquement des `var(--…)`. Pas de nouvelle dépendance CSS.
- **Imports** : une feature n'importe jamais une autre feature, sauf `documents/rendu` qui est conçu pour être partagé.

## 6. Ordre des étapes

Chaque étape fait l'objet de commits atomiques. Typecheck, lint, tests et build doivent passer à la fin de chacune.

| Étape | Contenu | Agent propriétaire |
|---|---|---|
| 0 | Commit de base sur `main`, puis branche `refonte-front`. Création des agents dans `.claude/agents/`. Correctif `maxWorkers` des tests. | moi |
| 1 | **Nettoyage** : `docs/design/`, `RubanProgression`, `dist/`, `.playwright-mcp/` | auditeur, puis moi |
| 2 | **Fondations** : `tokens.css`, `base.css`, police Geist, composants `ui/` | design-system |
| 3 | **Coque** : barre latérale, barre du haut, menu Nouveau, compteurs | design-system |
| 4a | **Articles** et ajout en masse | integrateur-ecrans n°1 |
| 4b | **Rendu des documents** : module autonome | integrateur-ecrans n°2, en parallèle de 4a |
| 4c | **Nouveau devis** (après 4b) | integrateur-ecrans |
| 4d | **Apparence des documents** (après 4b) | integrateur-ecrans |
| 4e | **Écrans hors maquette** passés au design system | integrateur-ecrans |
| 5 | `docs/REFONTE.md`, `CLAUDE.md`, captures avant/après | architecte, relecteur-qa |

Le relecteur QA intervient après chaque lot. Il lance typecheck, lint et tests, puis compare des captures Playwright à 1440×900 avec la maquette.

## 7. Fichiers sources de la maquette → cible

| Maquette | Cible dans le projet |
|---|---|
| `styles/tokens.css`, `styles/base.css` | `src/styles/tokens.css`, `src/styles/base.css` (remplacés) + `src/ui/*.css` |
| `components/sidebar/*`, `layout/Topbar`, `PageHeader`, `Toast` | `src/features/shell/*`. Toast fusionné avec le `ToastProvider` existant. |
| `pages/ArticlesPage` + `components/articles/*` | `src/features/articles/*`, sur `articlesApi` / `useCatalogue` (existants) |
| `pages/BulkAddPage` + `components/bulk/*` (`model.ts` : validation pure) | `src/features/articles/import/*`, `model.ts` testé |
| `pages/QuotePage` + `data/quote.ts` | `src/features/devis/editeur/*`. Les calculs fusionnent avec `calculerTotaux` (déjà testé). |
| `components/docs/DocumentPreview`, `DocTable`, `doc.css`, `theme.ts` | `src/features/documents/rendu/*` (autonome). Les utilitaires couleur vont dans `src/lib/couleur.ts`, testés. |
| `pages/AppearancePage`, `Studio`, `ColorWheel` | `src/features/documents/apparence/*` |
| `lib/useDismiss.ts` | fusionné avec `src/hooks/useMenu.ts` |

## 8. Points encore ouverts

- `xlsx` : voir la décision 6.
