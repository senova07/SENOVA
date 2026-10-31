import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/app/AppLayout'
import { RouteProtegee, RoutePublique } from '@/app/RouteProtegee'
import { TOUTES_ENTREES } from '@/features/shell/navigation'
import { PageAujourdhui } from '@/pages/PageAujourdhui'
import { PageConnexion, PageInscription } from '@/pages/PageAuth'
import { PageArticles } from '@/features/articles/PageArticles'
import { PageClients } from '@/features/clients/PageClients'
import { PageFicheClient } from '@/features/clients/PageFicheClient'
import { PageBientot } from '@/pages/PageBientot'
import { PageDevis } from '@/features/devis/PageDevis'
import { PageEspaceDevis } from '@/features/devis/PageEspaceDevis'
import { PageModelesDevis } from '@/features/devis/PageModelesDevis'
import { PageEditeurModele } from '@/features/devis/PageEditeurModele'

/** Anciennes rubriques sorties du menu : les liens existants restent valides. */
const ANCIENNES_PAGES = [
  ['/avoirs', 'Avoirs'],
  ['/relances', 'Relances'],
  ['/facturation-electronique', 'Facture électronique'],
] as const

export function App() {
  return (
    <Routes>
      <Route element={<RoutePublique />}>
        <Route path="/connexion" element={<PageConnexion />} />
        <Route path="/inscription" element={<PageInscription />} />
      </Route>
      <Route element={<RouteProtegee />}>
        <Route element={<AppLayout />}>
          <Route index element={<PageAujourdhui />} />
          <Route path="/articles" element={<PageArticles />} />
          <Route path="/clients" element={<PageClients />} />
          <Route path="/clients/:id" element={<PageFicheClient />} />
          <Route path="/devis" element={<PageDevis />} />
          <Route path="/devis/modeles" element={<PageModelesDevis />} />
          <Route path="/devis/modeles/:id" element={<PageEditeurModele />} />
          <Route path="/devis/:id" element={<PageEspaceDevis />} />
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
    </Routes>
  )
}
