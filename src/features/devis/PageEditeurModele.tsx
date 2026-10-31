import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bouton } from '@/ui/Bouton'
import { EtatVide } from '@/ui/EtatVide'
import { ChampTexte, ChampZone } from '@/ui/Formulaire'
import { Icone } from '@/ui/Icone'
import { Dialogue } from '@/ui/Dialogue'
import { useToast } from '@/store/toastContext'
import { ApercuDevis } from './ApercuDevis'
import {
  DEVIS_DEMO,
  magasinModeles,
  type EnteteModele,
  type ModeleDevis,
  type PoliceModele,
  type TableauModele,
} from './donnees'
import { LARGEUR_A4, POLICES, couleurSurAccent } from './styleFeuille'
import './modeles.css'

const COULEURS = [
  { hex: '#034a78', nom: 'Bleu SENOVA' },
  { hex: '#02a6ae', nom: 'Turquoise' },
  { hex: '#1f2a37', nom: 'Anthracite' },
  { hex: '#475569', nom: 'Ardoise' },
  { hex: '#1b6b4a', nom: 'Vert sapin' },
  { hex: '#8a1c2b', nom: 'Bordeaux' },
  { hex: '#b45309', nom: 'Ocre' },
  { hex: '#5b3a8c', nom: 'Prune' },
]

const POLICES_CHOIX: { valeur: PoliceModele; libelle: string }[] = [
  { valeur: 'moderne', libelle: 'Moderne' },
  { valeur: 'classique', libelle: 'Classique' },
  { valeur: 'technique', libelle: 'Technique' },
]

const BLOCS: { cle: keyof ModeleDevis['afficher']; libelle: string }[] = [
  { cle: 'references', libelle: 'Références articles' },
  { cle: 'tvaParLigne', libelle: 'TVA par ligne' },
  { cle: 'remiseParLigne', libelle: 'Remise par ligne' },
  { cle: 'signature', libelle: 'Bloc signature « Bon pour accord »' },
  { cle: 'conditions', libelle: 'Conditions' },
]

const HEX = /^#[0-9a-f]{6}$/i

/** Groupe de choix exclusifs : radios natifs masqués, la vignette cliquable porte l'état. */
function Choix<T extends string>({
  legende,
  valeur,
  options,
  onChange,
  className = '',
}: {
  legende: string
  valeur: T
  options: { valeur: T; libelle: string; visuel: ReactNode }[]
  onChange(v: T): void
  className?: string
}) {
  return (
    <fieldset className="modeles-groupe">
      <legend className="champ__libelle">{legende}</legend>
      <div className={`modeles-choix ${className}`}>
        {options.map((o) => (
          <label key={o.valeur} className="modeles-choix__option">
            <input
              type="radio"
              name={legende}
              value={o.valeur}
              checked={o.valeur === valeur}
              onChange={() => onChange(o.valeur)}
            />
            <span className="modeles-choix__visuel">{o.visuel}</span>
            <span className="modeles-choix__libelle">{o.libelle}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function Section({
  titre,
  ouvert,
  children,
}: {
  titre: string
  ouvert?: boolean
  children: ReactNode
}) {
  return (
    <details className="modeles-section" open={ouvert}>
      <summary>
        <span>{titre}</span>
        <Icone nom="chevron_bas" taille={16} />
      </summary>
      <div className="modeles-section__corps">{children}</div>
    </details>
  )
}

const SchemaEntete = ({ type }: { type: EnteteModele }) => (
  <span className={`modeles-schema modeles-schema--${type}`} aria-hidden="true">
    <i />
    <i />
    <i />
  </span>
)

export function PageEditeurModele() {
  const { id } = useParams()
  const modeles = magasinModeles.useListe()
  const enregistre = modeles.find((m) => m.id === id)

  if (!enregistre)
    return (
      <EtatVide
        titre="Modèle introuvable"
        texte="Ce modèle n’existe plus."
        action={
          <Link to="/devis/modeles" className="btn btn--secondaire">
            Retour aux modèles
          </Link>
        }
      />
    )
  return <Editeur key={enregistre.id} enregistre={enregistre} />
}

function Editeur({ enregistre }: { enregistre: ModeleDevis }) {
  const { notifier } = useToast()
  const navigate = useNavigate()
  const [modele, setModele] = useState(enregistre)
  const [saisieHex, setSaisieHex] = useState<string | null>(null)
  // Destination en attente de confirmation quand on quitte avec des modifications.
  const [quitter, setQuitter] = useState<string | null>(null)
  const [zone, setZone] = useState<HTMLElement | null>(null)
  const [echelle, setEchelle] = useState(0.7)

  const modifie = JSON.stringify(modele) !== JSON.stringify(enregistre)
  const nomValide = modele.nom.trim() !== ''

  useEffect(() => {
    if (!modifie) return
    const avertir = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avertir)
    return () => window.removeEventListener('beforeunload', avertir)
  }, [modifie])

  // La feuille A4 est réduite pour tenir dans la zone d'aperçu.
  useEffect(() => {
    if (!zone) return
    const mesurer = () => setEchelle(Math.min(1, (zone.clientWidth - 32) / LARGEUR_A4) || 0.7)
    mesurer()
    const obs = new ResizeObserver(mesurer)
    obs.observe(zone)
    return () => obs.disconnect()
  }, [zone])

  const maj = (partie: Partial<ModeleDevis>) => setModele((m) => ({ ...m, ...partie }))
  const majAfficher = (cle: keyof ModeleDevis['afficher'], v: boolean) =>
    setModele((m) => ({ ...m, afficher: { ...m.afficher, [cle]: v } }))

  const sauver = () => {
    if (!nomValide) return
    magasinModeles.enregistrer({ ...modele, nom: modele.nom.trim() })
    notifier('Modèle enregistré')
  }
  // shortcut: seuls Retour et le fil d'Ariane sont gardés ; la sidebar quitte sans confirmation
  // (pas de data router, donc pas de useBlocker). À brancher si l'app passe à createBrowserRouter.
  const aller = (chemin: string) => (modifie ? setQuitter(chemin) : void navigate(chemin))
  const lienGarde = (chemin: string) => ({
    to: chemin,
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      if (!modifie) return
      e.preventDefault()
      setQuitter(chemin)
    },
  })

  const devisDemo = { ...DEVIS_DEMO[0]!, conditions: modele.conditions }
  const accent = modele.couleurAccent.toLowerCase()

  return (
    <>
      <header className="entete-articles">
        <div className="entete-articles__texte">
          <nav aria-label="Fil d’Ariane" className="ariane">
            <Link {...lienGarde('/devis')}>Devis</Link>
            <Icone nom="suivant" taille={12} />
            <Link {...lienGarde('/devis/modeles')}>Modèles</Link>
            <Icone nom="suivant" taille={12} />
            <span aria-current="page">{enregistre.nom}</span>
          </nav>
          <h1 className="entete-articles__titre">Modifier le modèle</h1>
        </div>
        <div className="modeles-actions">
          <Bouton icone="retour" onClick={() => aller('/devis/modeles')}>
            Retour
          </Bouton>
          <Bouton
            variante="primaire"
            icone="valider"
            onClick={sauver}
            disabled={!modifie || !nomValide}
          >
            Enregistrer
          </Bouton>
        </div>
      </header>

      <div className="modeles-editeur">
        <div className="modeles-reglages">
          <Section titre="Identité" ouvert>
            <ChampTexte
              libelle="Nom du modèle"
              value={modele.nom}
              erreur={nomValide ? undefined : 'Donnez un nom au modèle.'}
              onChange={(e) => maj({ nom: e.target.value })}
            />
            <label className="modeles-case">
              <input
                type="checkbox"
                checked={modele.afficher.logo}
                onChange={(e) => majAfficher('logo', e.target.checked)}
              />
              Afficher le logo
            </label>
          </Section>

          <Section titre="Couleur d’accent" ouvert>
            <Choix
              legende="Couleur"
              valeur={COULEURS.find((c) => c.hex === accent)?.hex ?? ''}
              onChange={(hex) => {
                setSaisieHex(null)
                maj({ couleurAccent: hex })
              }}
              className="modeles-choix--nuancier"
              options={COULEURS.map((c) => ({
                valeur: c.hex,
                libelle: c.nom,
                visuel: <span className="modeles-nuance" style={{ background: c.hex }} />,
              }))}
            />
            <div className="modeles-hex">
              <input
                type="color"
                aria-label="Choisir une couleur"
                value={accent}
                onChange={(e) => {
                  setSaisieHex(null)
                  maj({ couleurAccent: e.target.value })
                }}
              />
              <ChampTexte
                libelle="Code hexadécimal"
                value={saisieHex ?? accent}
                maxLength={7}
                spellCheck={false}
                onChange={(e) => {
                  setSaisieHex(e.target.value)
                  if (HEX.test(e.target.value)) maj({ couleurAccent: e.target.value })
                }}
                onBlur={() => setSaisieHex(null)}
              />
            </div>
            <p className="modeles-contraste">
              <span style={{ background: accent, color: couleurSurAccent(accent) }}>Aa</span>
              Texte {couleurSurAccent(accent) === '#ffffff' ? 'blanc' : 'navy'} sur l’accent (choisi
              automatiquement)
            </p>
          </Section>

          <Section titre="Typographie">
            <Choix
              legende="Police"
              valeur={modele.police}
              onChange={(police) => maj({ police })}
              options={POLICES_CHOIX.map((p) => ({
                valeur: p.valeur,
                libelle: p.libelle,
                visuel: (
                  <span style={{ fontFamily: POLICES[p.valeur] }} className="modeles-aa">
                    Aa
                  </span>
                ),
              }))}
            />
          </Section>

          <Section titre="Mise en page de l’en-tête">
            <Choix
              legende="En-tête"
              valeur={modele.entete}
              onChange={(entete) => maj({ entete })}
              options={[
                {
                  valeur: 'gauche',
                  libelle: 'Logo à gauche',
                  visuel: <SchemaEntete type="gauche" />,
                },
                { valeur: 'centre', libelle: 'Centré', visuel: <SchemaEntete type="centre" /> },
                {
                  valeur: 'bandeau',
                  libelle: 'Bandeau de couleur',
                  visuel: <SchemaEntete type="bandeau" />,
                },
              ]}
            />
          </Section>

          <Section titre="Tableau des lignes">
            <Choix<TableauModele>
              legende="Style du tableau"
              valeur={modele.tableau}
              onChange={(tableau) => maj({ tableau })}
              options={[
                {
                  valeur: 'lignes',
                  libelle: 'Lignes fines',
                  visuel: (
                    <span className="modeles-tab modeles-tab--lignes" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  ),
                },
                {
                  valeur: 'zebre',
                  libelle: 'Zébré',
                  visuel: (
                    <span className="modeles-tab modeles-tab--zebre" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  ),
                },
                {
                  valeur: 'grille',
                  libelle: 'Grille',
                  visuel: (
                    <span className="modeles-tab modeles-tab--grille" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  ),
                },
              ]}
            />
            <Choix
              legende="Densité"
              valeur={modele.densite}
              onChange={(densite) => maj({ densite })}
              options={[
                { valeur: 'aeree', libelle: 'Aérée', visuel: <Icone nom="section" taille={20} /> },
                {
                  valeur: 'compacte',
                  libelle: 'Compacte',
                  visuel: <Icone nom="ordre" taille={20} />,
                },
              ]}
            />
          </Section>

          <Section titre="Colonnes et blocs affichés">
            {BLOCS.map((b) => (
              <label key={b.cle} className="modeles-case">
                <input
                  type="checkbox"
                  checked={modele.afficher[b.cle]}
                  onChange={(e) => majAfficher(b.cle, e.target.checked)}
                />
                {b.libelle}
              </label>
            ))}
          </Section>

          <Section titre="Textes">
            <ChampZone
              libelle="Texte d’introduction"
              value={modele.texteIntro}
              onChange={(e) => maj({ texteIntro: e.target.value })}
            />
            <ChampZone
              libelle="Conditions de paiement par défaut"
              value={modele.conditions}
              onChange={(e) => maj({ conditions: e.target.value })}
            />
            <ChampZone
              libelle="Pied de page (mentions légales)"
              value={modele.piedDePage}
              onChange={(e) => maj({ piedDePage: e.target.value })}
            />
          </Section>
        </div>

        <div className="modeles-apercu" ref={setZone} aria-label="Aperçu du devis">
          <div className="modeles-apercu__feuille" style={{ zoom: echelle }}>
            <ApercuDevis devis={devisDemo} modele={modele} />
          </div>
        </div>
      </div>

      <Dialogue
        ouvert={quitter !== null}
        onFermer={() => setQuitter(null)}
        titre="Quitter sans enregistrer ?"
        soustitre="Vos modifications seront perdues."
        pied={
          <>
            <Bouton onClick={() => setQuitter(null)}>Continuer à modifier</Bouton>
            <Bouton variante="danger" onClick={() => quitter && void navigate(quitter)}>
              Quitter
            </Bouton>
          </>
        }
      >
        <p>Les réglages de « {enregistre.nom} » n’ont pas été enregistrés.</p>
      </Dialogue>
    </>
  )
}
