import { useNavigate } from 'react-router-dom'
import { Icone, type NomIcone } from '@/ui/Icone'
import { Logo } from '@/ui/Logo'
import { useMenu } from '@/ui/useMenu'
import { useToast } from '@/store/toastContext'

const CREATIONS: readonly { libelle: string; icone: NomIcone; chemin?: string }[] = [
  { libelle: 'Client', icone: 'clients', chemin: '/clients?nouveau=1' },
  { libelle: 'Article', icone: 'articles', chemin: '/articles?nouveau=1' },
  { libelle: 'Devis', icone: 'devis', chemin: '/devis?nouveau=1' },
  { libelle: 'Facture', icone: 'factures' },
]

/** Topbar blanche : recherche ⌘K (visuelle pour l'instant), cloche, aide, « + Nouveau ». */
export function Header() {
  const { notifier } = useToast()
  const navigate = useNavigate()
  const { ouvert, ancre, basculer, fermer } = useMenu()
  const bientot = () => notifier('Bientôt disponible', { ton: 'info' })

  return (
    <header className="header">
      <span className="header__logo">
        <Logo />
      </span>
      <div className="recherche" role="search">
        <span className="recherche__icone">
          <Icone nom="recherche" taille={18} />
        </span>
        <label className="sr-only" htmlFor="recherche-globale">
          Rechercher un client, un devis, une facture, un article
        </label>
        <input
          id="recherche-globale"
          type="search"
          className="recherche__saisie"
          placeholder="Rechercher un client, un devis, une facture, un article…"
          onFocus={bientot}
        />
        <kbd className="recherche__raccourci" aria-hidden="true">
          ⌘ K
        </kbd>
      </div>
      <div className="header__actions">
        <button type="button" className="header__icone" aria-label="Notifications" onClick={bientot}>
          <Icone nom="cloche" taille={22} />
          <span className="header__pastille" aria-hidden="true" />
        </button>
        <button type="button" className="header__icone header__aide" aria-label="Aide" onClick={bientot}>
          <Icone nom="aide" taille={22} />
        </button>
        <div className="menu-ancre" ref={ancre}>
          <button
            type="button"
            className="btn-principal header__nouveau"
            aria-haspopup="menu"
            aria-expanded={ouvert}
            aria-label="Nouveau"
            onClick={basculer}
          >
            <Icone nom="plus" taille={18} className="header__nouveau-plus" />
            <span className="header__nouveau-texte">Nouveau</span>
            <Icone nom="chevron_bas" taille={14} poids="regular" className="btn-principal__chevron header__nouveau-chevron" />
          </button>
          {ouvert ? (
            <div className="menu__liste" role="menu" aria-label="Créer">
              {CREATIONS.map((c) => (
                <button
                  key={c.libelle}
                  type="button"
                  role="menuitem"
                  className="menu__item"
                  disabled={!c.chemin}
                  onClick={() => {
                    fermer()
                    if (c.chemin) navigate(c.chemin)
                  }}
                >
                  <Icone nom={c.icone} taille={18} />
                  {c.libelle}
                  {c.chemin ? null : <span className="menu__note">Bientôt</span>}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
