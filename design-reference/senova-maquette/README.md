# SENOVA — maquette Navigation + Articles

React 19 + TypeScript + Vite, icônes Phosphor (duotone au repos, fill à l'état actif).

```bash
npm install
npm run dev          # développement
npm run build:single # un seul fichier HTML autonome dans dist-single/
```

## Structure
- `src/styles/tokens.css` — couleurs, typo, rayons (clair + sombre)
- `src/styles/base.css` — boutons, champs, menus
- `src/components/sidebar/` — Sidebar, SidebarItem, NewMenu
- `src/components/layout/` — Topbar, PageHeader, Toast
- `src/components/articles/` — SearchBar, FilterTabs, FiltersPopover, ArticleTable, ArticleRow, RowMenu, FavoriteStar, TypeIndicator, ArticleDrawer
- `src/pages/ArticlesPage.tsx` — état de la page (recherche, filtres, tri)
- `src/data/` — articles mockés et définition de la navigation

Raccourcis : `/` recherche, `N` nouvel article, `Échap` ferme menus et panneau.

## Ajout d’articles en masse (`#articles-import`)
- Accès : menu du bouton « Nouvel article » ou bouton « Importer » de la page Articles.
- `src/pages/BulkAddPage.tsx` : modes, barre d’outils (Remplir, Valeurs par défaut, Colonnes, Agrandir), statut et pied fixe.
- `src/components/bulk/BulkGrid.tsx` : grille éditable (Tab, Maj+Tab, Entrée, flèches, collage multi-cellules, tri, sélection).
- `src/components/bulk/ImportFlow.tsx` : fichier (.xlsx, .csv) ou collage → association des colonnes → aperçu.
- `src/components/bulk/model.ts` : normalisation des valeurs, validation, synonymes d’en-têtes.
- Lecture Excel via SheetJS (`xlsx` 0.18.5 sur npm). En production, préférer la version à jour publiée par SheetJS sur son propre CDN.

## Nouveau devis (`#devis-nouveau`) et Apparence des documents (`#documents-apparence`)
- Accès : menu « + Nouveau » > Nouveau devis, ou page Devis > « Nouveau devis » ; page Documents > « Apparence des documents », ou bouton « Modifier l’apparence » dans l’aperçu du devis.
- `src/pages/QuotePage.tsx` : formulaire en 5 sections (client, informations, lignes, conditions, récapitulatif) + aperçu A4 en direct.
- `src/pages/AppearancePage.tsx` : progression, logo et palettes, roue chromatique, modèles, styles de tableau, police, en-tête/pied, mentions légales, textes, options, annuler / réinitialiser / appliquer.
- `src/components/docs/DocumentPreview.tsx` + `doc.css` : rendu A4 (devis, facture, avoir), 8 modèles de page (Classique pro, Colonne latérale, Hero image, Plan chantier, Épuré premium, Bandeau moderne, Bloc client, Artisan) × 10 styles de tableau, couleurs par variables CSS (teintes mélangées au blanc).
- `src/components/docs/DocTable.tsx` : tableau des prestations partagé entre l'aperçu A4 et les miniatures de la galerie.
- Modèles « Hero image » et « Artisan » : photo importée par l'utilisateur (champ `photo`), sinon motif à facettes aux couleurs du document. Aucune image générée.
- Pagination : le saut de page est signalé dans l'aperçu ; la répartition page par page (section gardée avec sa première ligne, totaux et signature non coupés, en-tête simplifié et titres de colonnes répétés) reste à faire côté génération PDF.
- `src/components/docs/theme.ts` : charte documentaire (DocTheme), palettes, polices, utilitaires couleur et extraction de palettes depuis un logo.
- `src/components/docs/ColorWheel.tsx` : roue chromatique (canvas) + curseur de luminosité, utilisable au clavier.
- `src/components/docs/Studio.tsx` + `studio.css` : sections numérotées, zoom de l’aperçu, onglets Modification / Aperçu sous 1200 px.
- `src/data/quote.ts` : données d’exemple et calculs (totaux HT, TVA par taux, TTC, acompte).
