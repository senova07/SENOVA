import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bouton } from '@/ui/Bouton'
import { Carte } from '@/ui/Carte'
import { Icone } from '@/ui/Icone'
import { MenuDeroulant } from '@/ui/Menu'
import { Dialogue } from '@/ui/Dialogue'
import { useToast } from '@/store/toastContext'
import { ApercuDevis } from './ApercuDevis'
import { DEVIS_DEMO, magasinModeles, modeleParDefaut, nouvelId, type ModeleDevis } from './donnees'
import './modeles.css'

/** Aperçu réduit : la feuille A4 (210 mm ≈ 794 px) mise à l'échelle de la vignette. */
function Vignette({ modele }: { modele: ModeleDevis }) {
  return (
    <div className="modeles-vignette" aria-hidden="true" inert>
      <div className="modeles-vignette__feuille">
        <ApercuDevis devis={DEVIS_DEMO[0]!} modele={modele} />
      </div>
    </div>
  )
}

export function PageModelesDevis() {
  const modeles = magasinModeles.useListe()
  const { notifier } = useToast()
  const navigate = useNavigate()
  const [aSupprimer, setASupprimer] = useState<ModeleDevis | null>(null)

  const creer = () => {
    const nouveau = {
      ...modeleParDefaut(modeles),
      id: nouvelId(),
      nom: 'Nouveau modèle',
      parDefaut: false,
    }
    magasinModeles.enregistrer(nouveau)
    void navigate(`/devis/modeles/${nouveau.id}`)
  }

  const dupliquer = (m: ModeleDevis) => {
    magasinModeles.enregistrer({ ...m, id: nouvelId(), nom: `${m.nom} (copie)`, parDefaut: false })
    notifier('Modèle dupliqué')
  }

  const definirParDefaut = (m: ModeleDevis) => {
    for (const autre of modeles) {
      if (autre.parDefaut && autre.id !== m.id)
        magasinModeles.enregistrer({ ...autre, parDefaut: false })
    }
    magasinModeles.enregistrer({ ...m, parDefaut: true })
    notifier(`« ${m.nom} » est le modèle par défaut`)
  }

  const supprimer = () => {
    if (!aSupprimer) return
    magasinModeles.supprimer(aSupprimer.id)
    notifier('Modèle supprimé')
    setASupprimer(null)
  }

  return (
    <>
      <header className="entete-articles">
        <div className="entete-articles__texte">
          <nav aria-label="Fil d’Ariane" className="ariane">
            <Link to="/devis">Devis</Link>
            <Icone nom="suivant" taille={12} />
            <span aria-current="page">Modèles</span>
          </nav>
          <h1 className="entete-articles__titre">Modèles de devis</h1>
          <p className="entete-articles__sous">
            Choisissez le design de vos devis : couleurs, police, en-tête et blocs affichés.
          </p>
        </div>
        <Bouton variante="primaire" onClick={creer}>
          Nouveau modèle
        </Bouton>
      </header>

      <ul className="modeles-grille">
        {modeles.map((m) => {
          const supprimable = !m.parDefaut && modeles.length > 1
          return (
            <li key={m.id}>
              <Carte className="modeles-carte">
                <Link
                  to={`/devis/modeles/${m.id}`}
                  className="modeles-carte__lien"
                  aria-label={`Modifier le modèle ${m.nom}`}
                >
                  <Vignette modele={m} />
                </Link>
                <div className="modeles-carte__pied">
                  <div className="modeles-carte__nom">
                    <span>{m.nom}</span>
                    {m.parDefaut ? <span className="badge badge--info">Par défaut</span> : null}
                  </div>
                  <MenuDeroulant
                    declencheur={({ ouvert, basculer }) => (
                      <button
                        type="button"
                        className="ligne-actions"
                        aria-label={`Actions : ${m.nom}`}
                        aria-haspopup="menu"
                        aria-expanded={ouvert}
                        onClick={basculer}
                      >
                        <Icone nom="actions" taille={20} poids="bold" />
                      </button>
                    )}
                  >
                    {(fermer) => (
                      <div className="menu__liste menu__liste--dessus" role="menu">
                        <Link
                          to={`/devis/modeles/${m.id}`}
                          role="menuitem"
                          className="menu__item"
                          onClick={fermer}
                        >
                          <Icone nom="crayon" taille={18} />
                          Modifier
                        </Link>
                        <button
                          type="button"
                          role="menuitem"
                          className="menu__item"
                          onClick={() => {
                            fermer()
                            dupliquer(m)
                          }}
                        >
                          <Icone nom="copier" taille={18} />
                          Dupliquer
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="menu__item"
                          disabled={m.parDefaut}
                          onClick={() => {
                            fermer()
                            definirParDefaut(m)
                          }}
                        >
                          <Icone nom="etoile" taille={18} />
                          Définir par défaut
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="menu__item menu__item--danger"
                          disabled={!supprimable}
                          title={
                            supprimable
                              ? undefined
                              : 'Impossible de supprimer le modèle par défaut ou le dernier modèle'
                          }
                          onClick={() => {
                            fermer()
                            setASupprimer(m)
                          }}
                        >
                          <Icone nom="poubelle" taille={18} />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </MenuDeroulant>
                </div>
              </Carte>
            </li>
          )
        })}
      </ul>

      <Dialogue
        ouvert={aSupprimer !== null}
        onFermer={() => setASupprimer(null)}
        titre="Supprimer ce modèle ?"
        soustitre={aSupprimer ? `« ${aSupprimer.nom} » sera supprimé définitivement.` : undefined}
        pied={
          <>
            <Bouton onClick={() => setASupprimer(null)}>Annuler</Bouton>
            <Bouton variante="danger" onClick={supprimer}>
              Supprimer
            </Bouton>
          </>
        }
      >
        <p>Les devis déjà créés avec ce modèle utiliseront le modèle par défaut.</p>
      </Dialogue>
    </>
  )
}
