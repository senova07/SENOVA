import { Navigate, Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'
import { AppLayout } from '@/app/AppLayout'
import { PageErreur } from '@/app/PageErreur'
import { RouteProtegee, RoutePublique } from '@/app/RouteProtegee'
import { TOUTES_ENTREES } from '@/features/shell/navigation'
import { PageAujourdhui } from '@/pages/PageAujourdhui'
import { PageConnexion, PageInscription } from '@/pages/PageAuth'
import { PageArticles } from '@/features/articles/PageArticles'
import { PageImportArticles } from '@/features/articles/import/PageImportArticles'
import { PageApparence } from '@/features/documents/apparence'
import { PageClients } from '@/features/clients/PageClients'
import { PageFicheClient } from '@/features/clients/PageFicheClient'
import { PageBientot } from '@/pages/PageBientot'
import { PageDevis } from '@/features/devis/PageDevis'
import { PageEditeurDevis } from '@/features/devis/PageEditeurDevis'

/** Anciennes rubriques sorties du menu : les liens existants restent valides. */
const ANCIENNES_PAGES = [
  ['/avoirs', 'Avoirs'],
  ['/relances', 'Relances'],
  ['/facturation-electronique', 'Facture électronique'],
] as const

/** Routeur de données : nécessaire à useBlocker (garde des modifications non enregistrées). */
export const routeur = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<PageErreur />}>
      <Route element={<RoutePublique />}>
        <Route path="/connexion" element={<PageConnexion />} />
        <Route path="/inscription" element={<PageInscription />} />
      </Route>
      <Route element={<RouteProtegee />}>
        <Route element={<AppLayout />}>
          <Route errorElement={<PageErreur />}>
          <Route index element={<PageAujourdhui />} />
          <Route path="/articles" element={<PageArticles />} />
          <Route path="/articles/import" element={<PageImportArticles />} />
          <Route path="/documents/apparence" element={<PageApparence />} />
          <Route path="/clients" element={<PageClients />} />
          <Route path="/clients/:id" element={<PageFicheClient />} />
          <Route path="/devis" element={<PageDevis />} />
          <Route path="/devis/modeles" element={<Navigate replace to="/documents/apparence" />} />
          <Route path="/devis/modeles/:id" element={<Navigate replace to="/documents/apparence" />} />
          <Route path="/devis/:id" element={<PageEditeurDevis />} />
          {TOUTES_ENTREES.filter((e) => !e.disponible).map((e) => (
            <Route key={e.chemin} path={e.chemin} element={<PageBientot titre={e.libelle} icone={e.iconePage ?? 'vide'} />} />
          ))}
          <Route path="/fournisseurs" element={<Navigate replace to="/partenaires" />} />
          {ANCIENNES_PAGES.map(([chemin, titre]) => (
            <Route key={chemin} path={chemin} element={<PageBientot titre={titre} icone="vide" />} />
          ))}
          <Route path="*" element={<PageBientot titre="Page introuvable" icone="vide" />} />
          </Route>
        </Route>
      </Route>
    </Route>,
  ),
)
