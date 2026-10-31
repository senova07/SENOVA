import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { RouteProtegee, RoutePublique } from '@/components/layout/RouteProtegee'
import { NAV_TOUTES } from '@/components/layout/navigation'
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

/** Pages qui ont un écran réel ; les autres entrées de la navigation affichent « Bientôt ». */
const PAGES_REELLES = ['/', '/articles', '/clients', '/devis', '/devis/modeles']

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
          {NAV_TOUTES.filter((e) => !PAGES_REELLES.includes(e.chemin) && !e.chemin.includes('?')).map((e) => (
            <Route
              key={e.chemin}
              path={e.chemin}
              element={<PageBientot titre={e.libelle} icone={e.icone} />}
            />
          ))}
          <Route path="*" element={<PageBientot titre="Page introuvable" icone="vide" />} />
        </Route>
      </Route>
    </Routes>
  )
}
