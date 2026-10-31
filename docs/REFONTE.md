# Refonte du front SENOVA

Branche : `refonte-front`. Source de vérité visuelle : `design-reference/senova-maquette/` (rendu compilé : `design-reference/senova.html`).
Audit de départ et décisions : [`AUDIT.md`](AUDIT.md). Captures : `docs/captures/{avant,apres,maquette}/`.

Principe retenu avec le propriétaire : **le front d'abord**. Les écrans sans API (devis, apparence des documents) fonctionnent sur des données de démo en mémoire, isolées derrière un `api.ts` par feature, aux signatures asynchrones identiques aux futurs appels HTTP. Brancher le back-end = remplacer l'intérieur de ces fonctions ; les composants ne changent pas.

## 1. Supprimé

| Élément | Raison / preuve |
|---|---|
| `docs/design/` (87 captures et images de maquettes, 16 Mo) | Aucune référence (grep). Jamais versionné, supprimé du disque. |
| `dist/`, `tsconfig.tsbuildinfo` | Sorties de build (ignorées par git). |
| `RubanProgression`, `etapesParcours`, styles `.ruban*` | Seul son propre test l'importait. |
| Ancienne coque : `components/layout/{Sidebar,Header,NavigationMobile,AppLayout,EntetePage,navigation}`, `styles/layout.css` | Remplacée par `features/shell` et `app/`. |
| `ModaleArticle`, `ListeArticles`, `catalogue.ts` | Remplacés par le nouvel écran Articles. |
| Ancien éditeur de devis : `PageEspaceDevis`, `EditeurLignes`, `BarreDevis`, `BlocTotaux`, `PanneauApercu`, `ApercuDevis`, `RechercheLigne`, `styleFeuille.ts`, `espace-devis.css`, `apercu.css`, `donnees.ts` | Remplacés par `PageEditeurDevis` + couche `api`/`calculs`/`versDocument`. |
| `ModaleApresAccord` | Simulait la création d'un bon de commande et d'une facture d'acompte par un simple toast (interdit : pas d'action simulée). |
| Modèles de devis : `PageModelesDevis`, `PageEditeurModele`, `modeles.css`, `MODELES_DEMO`, `magasinModeles` | La maquette les remplace par une apparence unique appliquée à tous les documents. `/devis/modeles*` redirige vers `/documents/apparence`. |
| Variables CSS et classes orphelines | Retirées au fil des lots (preuve par grep). |
| Bloc de compatibilité des anciens tokens (`--texte`, `--turquoise`, `--rayon`…) | Tous les écrans migrés vers les tokens de la maquette ; `--focus` devient un vrai token. |
| `heritage-tableau.css`, `Carte` / `CarteKpi`, alias `MenuDeroulant`, classes `champ*`, `styles/pages.css`, `.recherche*`, `.section-titre` | Plus aucune référence (grep) après la migration des écrans hors maquette. |
| `RechercheArticles`, `RechercheClients`, `LigneChiffres`, `colonnesClient.ts` | Remplacés par les composants partagés `ui/ChampRecherche`, `ui/Compteurs`. |
| `public/logo-symbole.png`, `public/logo-mot.png` | Remplacés par les images de la maquette (`src/assets/`) via `ui/Logo`. L'audit les mentionnait encore comme « à garder » : la décision a changé avec la nouvelle coque. |

Aucune dépendance supprimée (toutes utilisées). Aucune ajoutée.

## 2. Déplacé / réorganisé

| Avant | Après |
|---|---|
| `src/components/ui/*`, `src/hooks/useMenu.ts` | `src/ui/*` (un CSS par composant) |
| `src/App.tsx`, `components/layout/RouteProtegee*` | `src/app/` (`App.tsx` = routeur de données `createBrowserRouter`) |
| `Modale` → `Dialogue`, `MenuDeroulant` → `Menu` (alias conservé) | `src/ui/` |
| `features/devis/donnees.ts` | `types.ts`, `calculs.ts` (comportement inchangé, tests conservés), `demo.ts`, `magasin.ts`, `api.ts`, `versDocument.ts` |

## 3. Réécrit

- **Design system** : `styles/tokens.css` (tokens de la maquette + bloc de compatibilité des anciens noms, à retirer), `styles/base.css`, police Geist. Composants `ui/` : Bouton, BoutonMenu, Menu, Onglets, ControleSegmente, Interrupteur, CaseACocher, Formulaire, Dialogue, PanneauLateral (pile de calques `useCalque`), Toasts, EntetePage, Atelier, GardeModifications.
- **Coque** (`features/shell`) : barre latérale à l'identique de la maquette, barre du haut, menu Nouveau, menu du compte. Pas de sélecteur d'entreprise dans la barre latérale (changement d'organisation dans le menu du compte). Navigation filtrée par permissions.
- **Articles** (vraie API), **ajout en masse** (vraie API, création ligne par ligne), **Nouveau devis**, **Apparence des documents**, **rendu des documents** (`features/documents/rendu`, autonome, réutilisable pour le PDF).
- **Page d'erreur** du routeur, **garde des modifications** non enregistrées.
- **Écrans hors maquette** (Aujourd'hui, Clients, fiche client, liste des devis, connexion, « Bientôt ») passés au design system sans changer leur fonctionnement : en-tête de page, recherche pleine largeur, onglets, ligne de compteurs, tableau générique (`ui/Tableau.css`), menu de ligne (`ui/MenuLigne`). Plus de grosses cartes.
- **Composants partagés extraits** des doublons : `ui/Compteurs`, `ui/ChampRecherche`, `ui/MenuLigne`, `ui/Logo`, `lib/texte.ts`. Index publics `@/features/documents` et `@/features/devis` : plus aucun import interne d'une feature à l'autre.
- **Sécurité** (revues) : identifiants encodés dans les chemins d'API ; démos remises à zéro au changement d'organisation ; limites de taille et de lignes de l'import ; analyse CSV linéaire ; images limitées à 4000×4000 px.

### Exemples de décisions prises en cours de route
- Le toast « Relance envoyée » d'Aujourd'hui devient « Marquée comme relancée » : rien n'est envoyé.
- `ModaleApresAccord` supprimée (elle annonçait des créations fictives).
- Les modèles de devis disparaissent au profit de l'apparence unique de la maquette.

## 4. À brancher côté back-end

Toutes ces fonctions existent déjà côté front avec `demo: true`.

### Devis — `src/features/devis/api.ts`
| Fonction | Endpoint attendu |
|---|---|
| `lister` | `GET /api/devis` |
| `lire` | `GET /api/devis/:id` |
| `prochainNumero` | `GET /api/devis/prochain-numero` |
| `creerBrouillon` | `POST /api/devis` |
| `enregistrerBrouillon` | `PUT /api/devis/:id` |
| `dupliquer` | `POST /api/devis/:id/dupliquer` |
| `changerStatut` | `POST /api/devis/:id/statut` |
| `supprimer` | `DELETE /api/devis/:id` |
| Aperçu PDF, envoi au client | à créer (génération PDF à partir de `features/documents/rendu`, envoi e-mail) |

### Documents — `src/features/documents/api.ts`
| Fonction | Endpoint attendu |
|---|---|
| `apiCharte.lire` / `appliquer` | `GET` / `PUT /api/organisation/charte` |
| `apiReglagesDocuments.lire` / `appliquer` | `GET` / `PUT /api/organisation/documents` (mentions, textes, conditions) |

À prévoir côté serveur (revues de sécurité) :
- **Logos et photos** : vérifier le contenu réel (octets d'en-tête), nettoyer ou convertir les SVG, servir avec `Content-Disposition: attachment` et `Content-Security-Policy: sandbox`, isoler le générateur PDF du réseau, limiter les dimensions.
- **Charte reçue de l'API** : la revalider côté front à la lecture (couleurs `#RRGGBB`, polices de la liste).
- **Isolation par organisation** : chaque `/api/organisation/*` et `/api/devis*` porte sur l'organisation de la session, jamais sur un identifiant envoyé par le client ; cache front indexé par `organisation.id`.
- **Limite de débit** sur les écritures (création d'articles en masse notamment) : `limiter` par utilisateur et organisation, éventuellement quota d'articles.

### Autres
- **Super admin plateforme** (demande du propriétaire) : rôle au niveau de la plateforme, distinct des rôles d'organisation, pour superviser toutes les entreprises. Le front filtre déjà la navigation par permissions ; une zone « Administration plateforme » sera ajoutée.
- Recherche globale, notifications, aide : affichent « Bientôt disponible ».
- Factures, avoirs, paiements, prestations, dépenses, partenaires, équipe, automatisations, intégrations : écrans « Bientôt ».

## 5. Reste à faire côté front

- Pagination réelle des documents pour le PDF (sections non coupées, en-têtes de colonnes répétés).
- Import Excel (.xlsx) via la version officielle SheetJS (CDN, épinglée) ; CSV/TSV et collage seulement aujourd'hui.
- Recherche client / article de l'éditeur de devis : motif `combobox` avec flèches (aujourd'hui : boutons atteignables au Tab).
- « Page 1 sur N » dans la barre d'aperçu ; annulation après suppression d'une ligne de devis.
- Injecter la date (`maintenant`) dans Aujourd'hui et la liste des devis pour tester relances et filtres par période.
- `PageImportArticles.tsx` (202 lignes) reste légèrement au-dessus de la cible de 200.
- Rendu mobile (< 760 px) non revérifié par capture après la consolidation.
- Code découpé en un seul bundle de ~630 ko : découpage par route (`lazy`) à envisager.

## 6. Vérifications

- `npm run typecheck`, `npm run lint`, `npm test` (30 fichiers, 259 tests), `npm run build` : verts à chaque commit de lot.
- Chaque lot relu par un agent qui ne l'a pas écrit ; revue de sécurité sur l'import, l'apparence (images) et le devis ; points bloquants corrigés puis revérifiés.
- Captures avant / après à 1440×900 : `docs/captures/avant/`, `docs/captures/apres/`, référence `docs/captures/maquette/`.
